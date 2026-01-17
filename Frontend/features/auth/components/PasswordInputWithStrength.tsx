"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TbLockPassword } from "react-icons/tb";

type PasswordInputProps = {
  password: string;
  setPassword: (value: string) => void;
  showIcon?: boolean;
  id: string;
  name: string;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
  inputClassName?: string;
};

const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[\W_]/.test(password)) strength++;
  return strength;
};

const getStrengthColor = (strength: number, index: number): string => {
  if (index >= strength) return "bg-muted";
  switch (strength) {
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-green-500";
    default:
      return "bg-muted";
  }
};

const PasswordInputWithStrength = ({
  password,
  setPassword,
  id,
  label,
  name,
  placeholder,
  showIcon,
  labelClassName,
  inputClassName,
}: PasswordInputProps) => {
  const strength = calculatePasswordStrength(password);
  const strengthBars = new Array(4).fill(0);

  return (
    <>
      {label && (
        <Label htmlFor={id} className={labelClassName}>
          {label} <span className="text-destructive">*</span>
        </Label>
      )}

      <div className="flex mt-1">
        {showIcon && (
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
            <TbLockPassword className="text-muted-foreground text-lg" />
          </span>
        )}
        <Input
          type="password"
          name={name}
          id={id}
          placeholder={placeholder}
          required
          className={`${showIcon ? "rounded-l-none" : ""} ${inputClassName || ""}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex gap-1 my-2">
        {strengthBars.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded transition-colors ${getStrengthColor(strength, i)}`}
          />
        ))}
      </div>

      <p className="text-muted-foreground text-xs mb-0">
        Use 8+ characters with letters, numbers & symbols.
      </p>
    </>
  );
};

export default PasswordInputWithStrength;
