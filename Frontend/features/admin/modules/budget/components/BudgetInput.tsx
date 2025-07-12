"use client";

import { Pencil } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";

interface BudgetInputProps {
  initialAmount: number;
  onSave: (newAmount: number) => void;
  isSaving?: boolean;
}

const BudgetInput: React.FC<BudgetInputProps> = ({
  initialAmount,
  onSave,
  isSaving,
}) => {
  const [amount, setAmount] = useState(initialAmount);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setAmount(initialAmount);
  }, [initialAmount]);

  const handleSave = () => {
    if (amount >= 0) {
      onSave(amount);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setAmount(initialAmount);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <InputGroup size="sm" style={{ width: "200px" }}>
        <InputGroup.Text className="bg-light">$</InputGroup.Text>
        <Form.Control
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          onKeyDown={handleKeyPress}
          placeholder="0.00"
          autoFocus
          className="text-end"
        />
        <Button variant="success" size="sm" onClick={handleSave}>
          ✓
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={handleCancel}>
          ✕
        </Button>
      </InputGroup>
    );
  }

  return (
    <div className="d-flex align-items-center">
      {isSaving ? (
        <Spinner
          animation="border"
          size="sm"
          variant="primary"
          className="me-2"
          style={{ width: 18, height: 18 }}
        />
      ) : (
        <span className="me-2 text-muted fw-bold font-monospace">
          ${initialAmount.toLocaleString()}
        </span>
      )}
      <Button
        variant="link"
        size="lg"
        onClick={() => setIsEditing(true)}
        className="d-flex justify-content-center align-items-center p-0"
      >
        <Pencil size={25} className="text-primary" />
      </Button>
    </div>
  );
};

export default BudgetInput;
