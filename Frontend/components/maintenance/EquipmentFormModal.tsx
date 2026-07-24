import React, { useState, useEffect } from "react";
import { Equipment, EquipmentStatus, Subsidiary } from "../../types";
import { useI18n } from "../../i18n";
import { CreateEquipmentDto } from "../../services/apiMaintenance/apiEquipment";

interface EquipmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateEquipmentDto & { id?: string }) => void;
    equipment: Equipment | null;
    subsidiaries?: Subsidiary[];
}

const toDateInput = (iso?: string) =>
    iso ? new Date(iso).toISOString().split("T")[0] : "";

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    equipment,
    subsidiaries = [],
}) => {
    const { t } = useI18n();
    const isSuperAdmin = subsidiaries.length > 0;

    const initialState: CreateEquipmentDto & { id?: string } = {
        equipmentName: "",
        status: EquipmentStatus.OPERATIONAL,
        lastMaintenanceDate: "",
        nextMaintenanceDate: "",
        acquisitionDate: "",
        acquisitionValue: 0,
        subsidiaryId: subsidiaries[0]?.id ?? "",
    };

    const [formData, setFormData] = useState(initialState);

    useEffect(() => {
        if (equipment) {
            setFormData({
                id: equipment.id,
                equipmentName: equipment.equipmentName,
                status: equipment.status,
                lastMaintenanceDate: equipment.lastMaintenanceDate,
                nextMaintenanceDate: equipment.nextMaintenanceDate,
                acquisitionDate: equipment.acquisitionDate,
                acquisitionValue: equipment.acquisitionValue,
                subsidiaryId: equipment.subsidiaryId,
            });
        } else {
            setFormData({ ...initialState, subsidiaryId: subsidiaries[0]?.id ?? "" });
        }
    }, [equipment, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "acquisitionValue" ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h3 className="text-base font-bold text-slate-900">
                            {equipment ? t("maintenance.modal.editTitle") : t("maintenance.modal.addTitle")}
                        </h3>
                    </div>

                    <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Filiale — visible uniquement pour le SUPER_ADMIN en création */}
                        {isSuperAdmin && !equipment && (
                            <div>
                                <label htmlFor="subsidiaryId" className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Filiale *
                                </label>
                                <select
                                    name="subsidiaryId"
                                    id="subsidiaryId"
                                    value={formData.subsidiaryId ?? ""}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                >
                                    <option value="">Sélectionner une filiale…</option>
                                    {subsidiaries.map(s => (
                                        <option key={s.id} value={s.id}>{s.subsidiaryName}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label htmlFor="equipmentName" className="block text-xs font-semibold text-slate-500 mb-1.5">
                                {t("maintenance.form.name")} *
                            </label>
                            <input
                                type="text"
                                name="equipmentName"
                                id="equipmentName"
                                value={formData.equipmentName}
                                onChange={handleChange}
                                required
                                className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                            />
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-xs font-semibold text-slate-500 mb-1.5">
                                {t("maintenance.form.status")} *
                            </label>
                            <select
                                name="status"
                                id="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                            >
                                {Object.values(EquipmentStatus).map(s => (
                                    <option key={s} value={s}>{t(`maintenance.status_${s}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="acquisitionDate" className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    {t("maintenance.form.acquisitionDate")} *
                                </label>
                                <input
                                    type="date"
                                    name="acquisitionDate"
                                    id="acquisitionDate"
                                    value={toDateInput(formData.acquisitionDate)}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                />
                            </div>
                            <div>
                                <label htmlFor="acquisitionValue" className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    {t("maintenance.form.acquisitionValue")} *
                                </label>
                                <input
                                    type="number"
                                    name="acquisitionValue"
                                    id="acquisitionValue"
                                    value={formData.acquisitionValue}
                                    onChange={handleChange}
                                    required
                                    min={0}
                                    className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="lastMaintenanceDate" className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    {t("maintenance.form.lastMaintenanceDate")} *
                                </label>
                                <input
                                    type="date"
                                    name="lastMaintenanceDate"
                                    id="lastMaintenanceDate"
                                    value={toDateInput(formData.lastMaintenanceDate)}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                />
                            </div>
                            <div>
                                <label htmlFor="nextMaintenanceDate" className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    {t("maintenance.form.nextMaintenanceDate")} *
                                </label>
                                <input
                                    type="date"
                                    name="nextMaintenanceDate"
                                    id="nextMaintenanceDate"
                                    value={toDateInput(formData.nextMaintenanceDate)}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6e911]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-bold text-slate-800 bg-[#c6e911] rounded-lg hover:bg-[#adc40f] transition-colors"
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
