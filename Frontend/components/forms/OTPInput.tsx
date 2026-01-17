"use client";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OTPInputProps = {
  code: string[];
  setCode: (value: string[]) => void;
  label?: string;
  labelClassName?: string;
  inputClassName?: string;
};

const OTPInput = ({
  code,
  setCode,
  inputClassName,
  label,
  labelClassName,
}: OTPInputProps) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);

    if (value && idx < inputsRef.current.length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  return (
    <>
      <Label className={labelClassName}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-2">
        {code.map((number, idx) => (
          <Input
            key={idx}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            className={`text-center w-12 h-12 text-lg ${inputClassName}`}
            value={number}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            autoComplete="one-time-code"
          />
        ))}
      </div>
    </>
  );
};

export default OTPInput;
