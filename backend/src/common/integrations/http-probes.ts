export const publicHttpTargets = {
  'google-fonts':
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap',
  unsplash:
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=2787&auto=format&fit=crop',
  picsum: 'https://picsum.photos/id/237/200/200',
  'placeholder-images': 'https://via.placeholder.com/100',
  'google-cloud-storage':
    'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
  'whatsapp-links': 'https://wa.me/',
  'google-maps':
    'https://www.google.com/maps/search/?api=1&query=Ange+Raphael%2C+Douala%2C+Cameroun',
  facebook: 'https://www.facebook.com/caapmedia',
  instagram: 'https://www.instagram.com/caap.media2024',
  linkedin: 'https://www.linkedin.com/company/caapmedia',
} as const;

export type PublicHttpTarget = keyof typeof publicHttpTargets;

export class ProbeHttpError extends Error {
  constructor(readonly status: number) {
    super('Unexpected HTTP status from integration');
  }
}

export async function probeHttp(
  url: string,
  options: {
    headers?: Record<string, string>;
    acceptRedirect?: boolean;
  } = {},
) {
  const { headers, acceptRedirect = false } = options;
  const response = await fetch(url, {
    method: 'GET',
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(6000),
  });
  await response.body?.cancel();
  if (
    response.ok ||
    (acceptRedirect && [301, 302, 303, 307, 308].includes(response.status))
  )
    return;
  throw new ProbeHttpError(response.status);
}

export function probePublicHttp(id: PublicHttpTarget) {
  return probeHttp(publicHttpTargets[id], { acceptRedirect: true });
}
