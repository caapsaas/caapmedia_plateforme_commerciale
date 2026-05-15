import React, { useState, useEffect } from "react";
import { Equipment, EquipmentStatus } from "../../types";
import { useI18n } from "../../i18n";
import { useAuth } from "../../context/AuthContext";

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Equipment, "id" | "subsidiaryId" | "maintenanceHistory"> & {
      id?: string;
    },
  ) => void;
  equipment: Equipment | null;
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  equipment,
}) => {
  const { t } = useI18n();
  const initialFormState = {
    equipmentName: "",
    status: EquipmentStatus.OPERATIONAL,
    lastMaintenanceDate: new Date(),
    nextMaintenanceDate: new Date(),
    acquisitionDate: new Date(),
    acquisitionValue: 0,
  };

  const [formData, setFormData] = useState(initialFormState);
  const { user } = useAuth();

  useEffect(() => {
    if (equipment) {
      setFormData({
        equipmentName: equipment.equipmentName,
        status: equipment.status,
        lastMaintenanceDate: equipment.lastMaintenanceDate,
        nextMaintenanceDate: equipment.nextMaintenanceDate,
        acquisitionDate: equipment.acquisitionDate,
        acquisitionValue: equipment.acquisitionValue,
      });
      console.log('role admin is ', user?.userRole );
    } else {
      setFormData(initialFormState);
    }
  }, [equipment, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "acquisitionValue") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      lastMaintenanceDate: new Date(formData.lastMaintenanceDate),
      nextMaintenanceDate: new Date(formData.nextMaintenanceDate),
      acquisitionDate: new Date(formData.acquisitionDate),
      id: equipment?.id,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900">
              {equipment
                ? t("maintenance.modal.editTitle")
                : t("maintenance.modal.addTitle")}
            </h3>
            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label
                  htmlFor="equipmentName"
                  className="block text-sm font-medium text-slate-700"
                >
                  {t("maintenance.form.name")}
                </label>
                <input
                  type="text"
                  name="equipmentName"
                  id="equipmentName"
                  value={formData.equipmentName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-slate-700"
                >
                  {t("maintenance.form.status")}
                </label>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                >
                  {Object.values(EquipmentStatus).map((s) => (
                    <option key={s} value={s}>
                      {t(`maintenance.status_${s}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="acquisitionDate"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {t("maintenance.form.acquisitionDate")}
                  </label>
                  <input
                    type="date"
                    name="acquisitionDate"
                    id="acquisitionDate"
                    value={
                      formData.acquisitionDate
                        ? new Date(formData.acquisitionDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="acquisitionValue"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {t("maintenance.form.acquisitionValue")}
                  </label>
                  <input
                    type="number"
                    name="acquisitionValue"
                    id="acquisitionValue"
                    value={formData.acquisitionValue}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="lastMaintenanceDate"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {t("maintenance.form.lastMaintenanceDate")}
                  </label>
                  <input
                    type="date"
                    name="lastMaintenanceDate"
                    id="lastMaintenanceDate"
                    value={
                      formData.lastMaintenanceDate
                        ? new Date(formData.lastMaintenanceDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="nextMaintenanceDate"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {t("maintenance.form.nextMaintenanceDate")}
                  </label>
                  <input
                    type="date"
                    name="nextMaintenanceDate"
                    id="nextMaintenanceDate"
                    value={
                      formData.nextMaintenanceDate
                        ? new Date(formData.nextMaintenanceDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-slate-300 rounded-md shadow-sm py-2 px-4 border focus:border-[#c6e911] focus:ring-[#c6e911] sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#c6e911] text-slate-800 rounded-md hover:bg-[#adc40f] transition-colors"
            >
              {t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentFormModal;
