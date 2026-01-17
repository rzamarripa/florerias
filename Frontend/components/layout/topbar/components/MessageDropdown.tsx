"use client";
import { IconType } from "react-icons";
import { LuMails, LuShieldCheck } from "react-icons/lu";
import { TbXboxXFilled } from "react-icons/tb";
import Image, { StaticImageData } from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import user1 from "@/assets/images/users/user-1.jpg";
import user2 from "@/assets/images/users/user-2.jpg";
import user4 from "@/assets/images/users/user-4.jpg";
import user5 from "@/assets/images/users/user-5.jpg";
import user6 from "@/assets/images/users/user-6.jpg";

type MessageItemType = {
  id: string;
  user: {
    name: string;
    avatar?: StaticImageData;
    icon?: IconType;
    bgClass?: string;
  };
  action: string;
  context: string;
  timestamp: string;
  active?: boolean;
};

const messages: MessageItemType[] = [
  {
    id: "message-1",
    user: {
      name: "Liam Carter",
      avatar: user1,
    },
    action: "uploaded a new document to",
    context: "Project Phoenix",
    timestamp: "5 minutes ago",
    active: true,
  },
  {
    id: "message-2",
    user: {
      name: "Ava Mitchell",
      avatar: user2,
    },
    action: "commented on",
    context: "Marketing Campaign Q3",
    timestamp: "12 minutes ago",
  },
  {
    id: "message-3",
    user: {
      name: "Noah Blake",
      icon: LuShieldCheck,
      bgClass: "bg-blue-500",
    },
    action: "updated the status of",
    context: "Client Onboarding",
    timestamp: "30 minutes ago",
  },
  {
    id: "message-4",
    user: {
      name: "Sophia Taylor",
      avatar: user4,
    },
    action: "sent an invoice for",
    context: "Service Renewal",
    timestamp: "1 hour ago",
  },
  {
    id: "message-5",
    user: {
      name: "Ethan Moore",
      avatar: user5,
    },
    action: "completed the task",
    context: "UI Review",
    timestamp: "2 hours ago",
  },
  {
    id: "message-6",
    user: {
      name: "Olivia White",
      avatar: user6,
    },
    action: "assigned you a task in",
    context: "Sales Pipeline",
    timestamp: "Yesterday",
  },
];

const MessageDropdown = () => {
  return (
    <div className="topbar-item">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="topbar-link relative">
            <LuMails className="text-xl" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-500">
              7
            </Badge>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <h6 className="font-semibold text-sm">Messages</h6>
            <Badge variant="secondary" className="text-xs">
              09 Notifications
            </Badge>
          </div>

          <ScrollArea className="h-[300px]">
            {messages.map((message) => (
              <DropdownMenuItem
                key={message.id}
                className={`flex gap-3 p-3 cursor-pointer ${
                  message.active ? "bg-muted/50" : ""
                }`}
              >
                {message.user.icon && (
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${message.user.bgClass} text-white`}
                  >
                    <message.user.icon className="w-5 h-5" />
                  </span>
                )}
                {message.user.avatar && (
                  <Image
                    src={message.user.avatar.src}
                    height={36}
                    width={36}
                    className="rounded-full flex-shrink-0"
                    alt="User Avatar"
                  />
                )}

                <span className="flex-grow text-muted-foreground text-sm">
                  <span className="font-medium text-foreground">
                    {message.user.name}
                  </span>{" "}
                  {message.action}
                  <span className="font-medium text-foreground">
                    {" "}
                    {message.context}
                  </span>
                  <br />
                  <span className="text-xs">{message.timestamp}</span>
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-6 w-6"
                >
                  <TbXboxXFilled className="w-4 h-4" />
                </Button>
              </DropdownMenuItem>
            ))}
          </ScrollArea>

          <div className="border-t p-2">
            <Button variant="link" className="w-full text-sm">
              Read All Messages
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MessageDropdown;
