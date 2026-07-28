import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProximityResult {
  isValid: boolean;
  distanceMeters: number;
}

@Injectable()
export class AttendanceGeolocationService {
  private readonly logger = new Logger(AttendanceGeolocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Calcul de distance précis avec la formule Haversine
  // Adapté pour courtes distances (< 20km)
  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371000; // Rayon terrestre en mètres
    const φ1 = (lat1 * Math.PI) / 180; // Convertir en radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    // Formule Haversine
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  }

  // Valider la proximité employé ↔ filiale
  async validateProximity(
    employeeCoords: Coordinates,
    subsidiaryId: string,
    radiusMeters?: number,
  ): Promise<ProximityResult> {
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
      select: {
        latitude: true,
        longitude: true,
        geofenceRadius: true,
        subsidiaryName: true,
      },
    });

    if (!subsidiary) {
      throw new BadRequestException('Subsidiary not found');
    }

    if (!subsidiary.latitude || !subsidiary.longitude) {
      throw new BadRequestException(
        'Subsidiary geolocation not configured. Please contact HR.',
      );
    }

    const distance = this.haversineDistance(
      employeeCoords.lat,
      employeeCoords.lng,
      subsidiary.latitude,
      subsidiary.longitude,
    );

    // Utiliser le rayon de la filiale ou celui passé en paramètre
    const maxRadius = subsidiary.geofenceRadius || radiusMeters || 100;

    this.logger.debug(
      `Proximity check for ${subsidiary.subsidiaryName}: ${Math.round(distance)}m vs ${maxRadius}m radius`,
    );

    return {
      isValid: distance <= maxRadius,
      distanceMeters: Math.round(distance),
    };
  }

  // Vérifier si l'arrivée est en retard (après 09:00)
  async isArrivalLate(arrivalTime: Date): Promise<boolean> {
    const hour = arrivalTime.getHours();
    const minute = arrivalTime.getMinutes();

    // Retard après 09:00
    return hour > 9 || (hour === 9 && minute > 0);
  }

  // Valider la précision GPS (filtre les mauvaises mesures)
  isAccuracyAcceptable(
    accuracyMeters: number,
    acceptableThreshold: number = 50,
  ): boolean {
    // Excellente précision: < 50m
    // Acceptable: < 100m
    // Pauvre: > 100m (rejeter)
    return accuracyMeters < 100;
  }

  // Obtenir le seuil d'acceptabilité
  getAccuracyStatus(
    accuracyMeters: number,
  ): 'excellent' | 'acceptable' | 'poor' {
    if (accuracyMeters < 50) return 'excellent';
    if (accuracyMeters < 100) return 'acceptable';
    return 'poor';
  }
}
