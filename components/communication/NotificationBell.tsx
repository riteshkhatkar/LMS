"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, MessageSquare, ExternalLink, ShieldAlert, BookOpen, Award } from "lucide-react";

interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  body: string;
  destination?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell({ locale }: { locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications?limit=5");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const markItemRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark item read:", err);
    }
  };

  const getEventIcon = (type: string) => {
    if (type.includes("MESSAGE")) return <MessageSquare className="w-4 h-4 text-sky-600" />;
    if (type.includes("CERTIFICATE")) return <Award className="w-4 h-4 text-emerald-600" />;
    if (type.includes("COURSE")) return <BookOpen className="w-4 h-4 text-indigo-600" />;
    return <ShieldAlert className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-sky-100 text-sky-800 rounded-md">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                    !item.isRead ? "bg-sky-50/50" : ""
                  }`}
                  onClick={() => !item.isRead && markItemRead(item.id)}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-slate-200 shrink-0">
                    {getEventIcon(item.eventType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${!item.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {item.body}
                    </p>
                    {item.destination && (
                      <Link
                        href={item.destination.startsWith("/") ? `/${locale}${item.destination}` : item.destination}
                        className="inline-flex items-center gap-1 text-[11px] text-[#3E9BDB] font-semibold mt-1 hover:underline"
                        onClick={() => setIsOpen(false)}
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <Link
              href={`/${locale}/learn/notifications`}
              onClick={() => setIsOpen(false)}
              className="text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-200/60"
            >
              All Notifications
            </Link>
            <Link
              href={`/${locale}/learn/messages`}
              onClick={() => setIsOpen(false)}
              className="text-[#3E9BDB] hover:text-[#123E62] font-semibold px-2 py-1 rounded hover:bg-sky-50"
            >
              Messages & Q&A
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
