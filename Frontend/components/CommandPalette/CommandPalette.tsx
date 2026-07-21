"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { clientsService } from "@/features/admin/modules/clients/services/clients";
import { ordersService } from "@/features/admin/modules/orders/services/orders";
import { Client } from "@/features/admin/modules/clients/types";
import { Order } from "@/features/admin/modules/orders/types";
import {
  ShoppingCart,
  Users,
  Plus,
  Receipt,
  Phone,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  // Evita mismatch de hidratación: el acceso depende de stores del cliente,
  // así que no renderizamos nada hasta montar en el navegador.
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const { getIsAdmin, getIsSuperAdmin, getIsCashier, getIsManager } = useUserRoleStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user has permission to use the command palette
  const hasAccess = getIsAdmin() || getIsSuperAdmin() || getIsCashier() || getIsManager();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (hasAccess) {
          setOpen((prev) => !prev);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasAccess]);

  // Load recent orders when dialog opens
  useEffect(() => {
    if (open && recentOrders.length === 0) {
      loadRecentOrders();
    }
  }, [open]);

  // Search clients with debounce
  useEffect(() => {
    if (!search.trim()) {
      setClients([]);
      return;
    }

    const timer = setTimeout(() => {
      searchClients(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadRecentOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await ordersService.getAllOrders({ limit: 5 });
      if (response.success) {
        setRecentOrders(response.data);
      }
    } catch (error) {
      console.error("Error loading recent orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const searchClients = async (term: string) => {
    setIsLoadingClients(true);
    try {
      const response = await clientsService.getAllClients({ name: term, limit: 5 });
      if (response.success) {
        setClients(response.data);
      }
    } catch (error) {
      console.error("Error searching clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const goToClient = useCallback(
    (clientId: string) => {
      setOpen(false);
      setSearch("");
      router.push(`/panel/clientes?clientId=${clientId}`);
    },
    [router]
  );

  const goToOrder = useCallback(
    (orderId: string) => {
      setOpen(false);
      setSearch("");
      router.push(`/sucursal/ventas?orderId=${orderId}`);
    },
    [router]
  );

  const goToPage = useCallback(
    (path: string) => {
      setOpen(false);
      setSearch("");
      router.push(path);
    },
    [router]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // No renderizar en SSR ni si el usuario no tiene acceso (evita hydration mismatch)
  if (!mounted || !hasAccess) {
    return null;
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Buscar"
      description="Buscar clientes, ventas o acciones rápidas"
    >
      <CommandInput
        placeholder="Buscar cliente o venta..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isLoadingClients || isLoadingOrders
            ? "Buscando..."
            : "No se encontraron resultados."}
        </CommandEmpty>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <CommandGroup heading="Ventas recientes">
            {recentOrders.map((order) => (
              <CommandItem
                key={order._id}
                value={`order-${order._id}-${order.orderNumber}`}
                onSelect={() => goToOrder(order._id)}
                className="cursor-pointer"
              >
                <Receipt className="mr-2 h-4 w-4" />
                <span className="flex-1">
                  #{order.orderNumber} - {order.clientInfo?.name || "Sin cliente"}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(order.total)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Client Search Results */}
        {search && clients.length > 0 && (
          <CommandGroup heading="Clientes">
            {clients.map((client) => (
              <CommandItem
                key={client._id}
                value={`client-${client._id}-${client.name}-${client.lastName}`}
                onSelect={() => goToClient(client._id)}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                <span className="flex-1">
                  {client.name} {client.lastName}
                </span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {client.phoneNumber}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        <CommandGroup heading="Acciones rápidas">
          <CommandItem
            value="nuevo-pedido"
            onSelect={() => goToPage("/sucursal/nuevo-pedido")}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Nuevo Pedido</span>
          </CommandItem>
          <CommandItem
            value="ver-clientes"
            onSelect={() => goToPage("/panel/clientes")}
            className="cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Ver Clientes</span>
          </CommandItem>
          <CommandItem
            value="ver-ventas"
            onSelect={() => goToPage("/sucursal/ventas")}
            className="cursor-pointer"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Ver Ventas</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
