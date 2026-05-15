import React, { useState } from "react";
import { useI18n } from "../../i18n";
import { useToast } from "../../context/ToastContext";
import { Equipment, EquipmentStatus } from "../../types";
import IconPlus from "../icons/IconPlus";
import IconEdit from "../icons/IconEdit";
import IconDelete from "../icons/IconDelete";
import IconClipboardList from "../icons/IconClipboardList";
import EquipmentFormModal from "./EquipmentFormModal";
import ConfirmationModal from "../common/ConfirmationModal";
import MaintenanceLogModal from "./MaintenanceLogModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  CreateEquipmentDto,
} from "../../services/apiMaintenance/apiEquipment";
import {
  createMaintenanceRecord,
  CreateMaintenanceRecordDto,
} from "../../services/apiMaintenance/apiMaintenance_record";
import { useAuth } from "../../context/AuthContext";
type SaveEquipmentDto = CreateEquipmentDto & { id?: string };

const toISODate = (date?: string) => {
    if (!date) return undefined

    return new Date(date).toISOString()
}


const Maintenance: React.FC = () => {
  const { t } = useI18n();
  const toast = useToast();
  const { subsidiary } = useAuth();
  const queryClient = useQueryClient();

  // --- Data Fetching & Mutations ---
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment", subsidiary?.id],
    queryFn: getEquipments,
    enabled: !!subsidiary,
  });
  const { mutate: createMutation } = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success(
        "Équipement ajouté!",
        "L'équipement a été ajouté avec succès.",
      );
    },
    onError: () => {
      toast.error(
        "Erreur d'ajout",
        "Une erreur est survenue lors de l'ajout de l'équipement.",
      );
    },
  });
  const { mutate: updateMutation } = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateEquipmentDto>;
    }) => updateEquipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success(
        "Équipement modifié!",
        "L'équipement a été modifié avec succès.",
      );
    },
    onError: () => {
      toast.error(
        "Erreur de modification",
        "Une erreur est survenue lors de la modification de l'équipement.",
      );
    },
  });
  const { mutate: deleteMutation } = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success(
        "Équipement supprimé!",
        "L'équipement a été supprimé avec succès.",
      );
    },
    onError: () => {
      toast.error(
        "Erreur de suppression",
        "Une erreur est survenue lors de la suppression de l'équipement.",
      );
    },
  });
  const { mutate: addLogMutation } = useMutation({
    mutationFn: (data: CreateMaintenanceRecordDto) =>
      createMaintenanceRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success(
        "Journal ajouté!",
        "Le journal de maintenance a été ajouté avec succès.",
      );
    },
    onError: () => {
      toast.error(
        "Erreur de journal",
        "Une erreur est survenue lors de l'ajout du journal de maintenance.",
      );
    },
  });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null,
  );
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(
    null,
  );
  const [viewingLogFor, setViewingLogFor] = useState<Equipment | null>(null);

  const handleOpenAddModal = () => {
    setEditingEquipment(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: Equipment) => {
    setEditingEquipment(item);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (item: Equipment) => {
    setDeletingEquipment(item);
  };

  const handleOpenLogModal = (item: Equipment) => {
    setViewingLogFor(item);
    setIsLogModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsLogModalOpen(false);
    setDeletingEquipment(null);
  };

  const handleSave = (data: SaveEquipmentDto) => {
    const { id, ...saveData } = data;
    if (id) {
      updateMutation({ id, data: saveData });
    } else {
      createMutation(saveData);
    }
    handleCloseModals();
  };

  const handleDelete = () => {
    if (deletingEquipment) {
      deleteMutation(deletingEquipment.id);
      handleCloseModals();
    }
  };

  const getStatusClass = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.OPERATIONAL:
        return "bg-green-100 text-green-800";
      case EquipmentStatus.NEEDS_MAINTENANCE:
        return "bg-yellow-100 text-yellow-800";
      case EquipmentStatus.OUT_OF_SERVICE:
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">
        {t("maintenance.title")}
      </h2>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-800">
            {t("maintenance.title")}
          </h3>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 px-4 py-2 bg-[#c6e911] text-slate-800 text-sm font-semibold rounded-md hover:bg-[#adc40f] transition-colors"
          >
            <IconPlus className="h-4 w-4" />
            <span>{t("maintenance.addEquipment")}</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          {isLoading || !subsidiary ? (
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    {t("maintenance.equipmentName")}
                  </th>
                  <th scope="col" className="px-6 py-3">
                    {t("maintenance.status")}
                  </th>
                  <th scope="col" className="px-6 py-3">
                    {t("maintenance.lastMaintenance")}
                  </th>
                  <th scope="col" className="px-6 py-3">
                    {t("maintenance.nextMaintenance")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr
                    key={i}
                    className="bg-white border-b hover:bg-slate-50"
                    style={{ opacity: 1 - i * 0.15 }}
                  >
                    <td className="px-6 py-4">
                      <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center space-x-1">
                        <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
                        <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
                        <div className="h-8 w-8 bg-slate-200 rounded-full animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : equipment.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              {t("maintenance.noEquipment")}
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    {t("maintenance.equipmentName")}
                  </th>
                  <th scope="col" className="px-6 py-3">
                    {t("maintenance.status")}
                  </th>
                  <th scope="col" className="px-6 py-3">
                    {t("maintenance.lastMaintenance")}
                  </th>
                  <th scope="col" className="px-6 py-3">
                    {t("maintenance.nextMaintenance")}
                  </th>
                  <th scope="col" className="px-6 py-3 text-center">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-white border-b hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {item.equipmentName}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(item.status)}`}
                      >
                        {t(`maintenance.status_${item.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(item.lastMaintenanceDate).toLocaleDateString(
                        "fr-FR",
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(item.nextMaintenanceDate).toLocaleDateString(
                        "fr-FR",
                      )}
                    </td>
                    <td className="px-6 py-4 text-center space-x-1">
                      <button
                        onClick={() => handleOpenLogModal(item)}
                        className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-100 rounded-full"
                        title={t("maintenance.history")}
                      >
                        <IconClipboardList className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                        title={t("common.edit")}
                      >
                        <IconEdit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(item)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full"
                        title={t("common.delete")}
                      >
                        <IconDelete className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isFormModalOpen && (
        <EquipmentFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSave={handleSave}
          equipment={editingEquipment}
        />
      )}
      {deletingEquipment && (
        <ConfirmationModal
          isOpen={!!deletingEquipment}
          onClose={handleCloseModals}
          onConfirm={handleDelete}
          title={t("maintenance.modal.deleteTitle")}
          message={t("configuration.modal.deleteConfirmMessage", {
            itemName: deletingEquipment.equipmentName,
          })}
        />
      )}
      {isLogModalOpen && viewingLogFor && (
        <MaintenanceLogModal
          isOpen={isLogModalOpen}
          onClose={handleCloseModals}
          equipment={viewingLogFor}
          onAddLog={addLogMutation}
        />
      )}
    </div>
  );
};

export default Maintenance;
