import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ClientSession {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  clientNumber: string;
  points: number;
  company: string;
}

interface ClientSessionState {
  client: ClientSession | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface ClientSessionActions {
  setClient: (client: ClientSession, token: string) => void;
  logout: () => void;
  clearClient: () => void;
}

interface ClientSessionGetters {
  getClientId: () => string | null;
  getClientName: () => string | null;
  getClientFullName: () => string | null;
}

type ClientSessionStore = ClientSessionState &
  ClientSessionActions &
  ClientSessionGetters;

export const useClientSessionStore = create<ClientSessionStore>()(
  persist(
    (set, get) => ({
      client: null,
      token: null,
      isAuthenticated: false,

      getClientId: () => {
        return get().client?._id || null;
      },

      getClientName: () => {
        return get().client?.name || null;
      },

      getClientFullName: () => {
        const client = get().client;
        if (!client) return null;
        return `${client.name} ${client.lastName}`;
      },

      setClient: (client: ClientSession, token: string) => {
        set({
          client,
          token,
          isAuthenticated: true,
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("clientAuthToken", token);
        }
      },

      logout: () => {
        set({
          client: null,
          token: null,
          isAuthenticated: false,
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("clientAuthToken");
        }
      },

      clearClient: () => {
        set({
          client: null,
          token: null,
          isAuthenticated: false,
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("clientAuthToken");
        }
      },
    }),
    {
      name: "client-session",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token;
        }
      },
    }
  )
);
