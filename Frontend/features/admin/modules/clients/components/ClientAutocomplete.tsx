"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Client } from "@/features/admin/modules/clients/types";
import { clientsService } from "@/features/admin/modules/clients/services/clients";

/** Forma mínima para mostrar la etiqueta del cliente seleccionado */
type SelectedClientLike = {
  _id: string;
  name: string;
  lastName: string;
  phoneNumber?: string;
} | null;

interface ClientAutocompleteProps {
  /** _id del cliente seleccionado */
  value?: string;
  /** Se invoca con el cliente elegido (o null al limpiar) */
  onSelect: (client: Client | null) => void;
  /** Cliente preseleccionado (para mostrar su nombre sin tener que buscarlo) */
  selectedClient?: SelectedClientLike;
  companyId?: string;
  branchId?: string;
  /** Filtrar por estatus (default: solo activos) */
  status?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Autocomplete de clientes con búsqueda server-side (debounce).
 * Busca sobre TODA la base (no solo un tope precargado) y conserva
 * el nombre del cliente seleccionado en el botón.
 */
const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  value,
  onSelect,
  selectedClient: selectedClientProp = null,
  companyId,
  branchId,
  status = true,
  disabled = false,
  placeholder = "Seleccionar cliente...",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<SelectedClientLike>(selectedClientProp);

  // Sincronizar con prop externa / limpieza de valor
  useEffect(() => {
    if (selectedClientProp) setPicked(selectedClientProp);
  }, [selectedClientProp]);

  useEffect(() => {
    if (!value) setPicked(null);
  }, [value]);

  // Búsqueda server-side con debounce
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const response = await clientsService.getAllClients({
          search: term,
          status,
          limit: 50,
          ...(companyId ? { companyId } : {}),
          ...(branchId ? { branchId } : {}),
        });
        setResults(response.data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [search, companyId, branchId, status]);

  const sorted = useMemo(
    () =>
      [...results]
        .sort((a, b) =>
          `${a.name} ${a.lastName}`.localeCompare(`${b.name} ${b.lastName}`, "es", {
            sensitivity: "base",
          })
        )
        .slice(0, 100),
    [results]
  );

  const label = picked
    ? `${picked.name} ${picked.lastName}${picked.phoneNumber ? ` - ${picked.phoneNumber}` : ""}`
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn("truncate", !picked && "text-muted-foreground")}>
            {picked ? label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre, teléfono o número..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading
                ? "Buscando..."
                : search.trim().length < 2
                ? "Escribe al menos 2 caracteres..."
                : "No se encontraron clientes."}
            </CommandEmpty>
            <CommandGroup>
              {sorted.map((client) => (
                <CommandItem
                  key={client._id}
                  value={client._id}
                  onSelect={() => {
                    setPicked(client);
                    onSelect(client);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client.name} {client.lastName} - {client.phoneNumber}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ClientAutocomplete;
