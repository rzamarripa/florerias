"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface DateTimeSeparatedInputProps {
  /** Valor combinado en formato datetime-local: "YYYY-MM-DDTHH:mm" */
  value: string;
  /** Recibe el valor combinado "YYYY-MM-DDTHH:mm" ("" si no hay fecha ni hora) */
  onChange: (value: string) => void;
  required?: boolean;
  /** Fecha mínima permitida, formato "YYYY-MM-DD" */
  minDate?: string;
  disabled?: boolean;
  className?: string;
  /** Se invoca cuando alguno de los inputs falla la validación nativa */
  onInvalid?: (e: React.InvalidEvent<HTMLInputElement>) => void;
}

/**
 * Reemplaza al input `datetime-local` (cuyo widget nativo varía mucho entre
 * navegadores) por dos inputs separados: uno de fecha y otro de hora.
 * Internamente compone/descompone el mismo string "YYYY-MM-DDTHH:mm", así que
 * es un reemplazo directo: el padre sigue manejando un único valor.
 */
export function DateTimeSeparatedInput({
  value,
  onChange,
  required,
  minDate,
  disabled,
  className,
  onInvalid,
}: DateTimeSeparatedInputProps) {
  const [datePart = "", rawTimePart = ""] = (value || "").split("T");
  const timePart = rawTimePart.slice(0, 5); // normalizar a HH:mm

  const todayDate = () => new Date().toISOString().slice(0, 10);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    const date = e.target.value;
    if (!date) {
      onChange("");
      return;
    }
    onChange(`${date}T${timePart || "12:00"}`);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.setCustomValidity("");
    const time = e.target.value;
    if (!time && !datePart) {
      onChange("");
      return;
    }
    const baseDate = datePart || todayDate();
    onChange(`${baseDate}T${time || "00:00"}`);
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className ?? ""}`}>
      <Input
        type="date"
        value={datePart}
        onChange={handleDateChange}
        onInvalid={onInvalid}
        min={minDate}
        required={required}
        disabled={disabled}
        aria-label="Fecha"
      />
      <Input
        type="time"
        value={timePart}
        onChange={handleTimeChange}
        onInvalid={onInvalid}
        required={required}
        disabled={disabled}
        aria-label="Hora"
      />
    </div>
  );
}
