"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X } from "lucide-react";
import { useState } from "react";

const HEBREW_MONTHS = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

// חגים עבריים (תאריכים משוערים)
const HEBREW_HOLIDAYS = [
    { id: "h1", date: "2026-01-14", title: "ט״ו בשבט", isHoliday: true },
    { id: "h2", date: "2026-03-14", title: "פורים", isHoliday: true },
    { id: "h3", date: "2026-04-13", title: "פסח", isHoliday: true },
    { id: "h4", date: "2026-05-03", title: "יום העצמאות", isHoliday: true },
    { id: "h5", date: "2026-06-02", title: "שבועות", isHoliday: true },
    { id: "h6", date: "2026-09-21", title: "ראש השנה", isHoliday: true },
    { id: "h7", date: "2026-09-30", title: "יום כיפור", isHoliday: true },
    { id: "h8", date: "2026-10-05", title: "סוכות", isHoliday: true },
    { id: "h9", date: "2026-12-16", title: "חנוכה", isHoliday: true }
];

export default function Calendar() {
    const { team, user, addEvent, deleteEvent } = useApp();
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newEventTitle, setNewEventTitle] = useState("");

    if (!team || !user) return null;

    const isCoordinator = user.role === "creator" || user.role === "coordinator";
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const changeMonth = (delta: number) => {
        let newMonth = currentMonth + delta;
        let newYear = currentYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const getDateString = (day: number) => {
        const month = String(currentMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        return `${currentYear}-${month}-${dayStr}`;
    };

    const getHebrewDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
                day: 'numeric',
                month: 'long'
            }).format(date);
        } catch (e) {
            return "";
        }
    };

    const allEvents = [...(team.events || []), ...HEBREW_HOLIDAYS];

    const handleDayClick = (day: number) => {
        const dateStr = getDateString(day);
        setSelectedDate(dateStr);
    };

    const handleAddEvent = async () => {
        if (!selectedDate || !newEventTitle.trim()) return;
        await addEvent(selectedDate, newEventTitle);
        setNewEventTitle("");
    };

    const handleDeleteEvent = async (eventId: string) => {
        await deleteEvent(eventId);
    };

    const selectedDateEvents = allEvents.filter(e => e.date === selectedDate);
    const selectedDateHebrew = selectedDate ? getHebrewDate(selectedDate) : "";

    const upcomingEvents = allEvents
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    return (
        <div className="w-full space-y-6 pb-24 px-4 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {HEBREW_MONTHS[currentMonth]} {currentYear}
                    </h2>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            {/* Grid */}
            <Card className="p-4 border-none shadow-md bg-white rounded-3xl overflow-hidden">
                <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                    {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map(d => (
                        <div key={d} className="text-xs font-black text-indigo-300 py-2">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dateNum = i + 1;
                        const dateStr = getDateString(dateNum);
                        const dayEvents = allEvents.filter(e => e.date === dateStr);
                        const isHoliday = dayEvents.some(e => e.isHoliday);
                        const isSelected = selectedDate === dateStr;
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;

                        return (
                            <div
                                key={dateNum}
                                className="flex flex-col items-center relative py-1"
                                onClick={() => handleDayClick(dateNum)}
                            >
                                <div className={`
                                    w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-bold transition-all
                                    ${isSelected ? "bg-indigo-600 text-white shadow-lg scale-110 z-10" :
                                        isToday ? "bg-orange-100 text-orange-600 border border-orange-200" :
                                            dayEvents.length > 0 ? (isHoliday ? "bg-purple-100 text-purple-600" : "bg-indigo-50 text-indigo-600") :
                                                "text-gray-600 hover:bg-gray-50"}
                                    cursor-pointer
                                `}>
                                    {dateNum}
                                </div>
                                {dayEvents.length > 0 && !isSelected && (
                                    <div className={`absolute bottom-0 w-1 h-1 rounded-full ${isHoliday ? "bg-purple-400" : "bg-indigo-400"}`}></div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Selected Day Details */}
            {selectedDate && (
                <Card className="p-5 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start mb-4">
                        <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-gray-200 rounded-full">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                        <div className="text-right">
                            <h3 className="font-black text-indigo-900 text-lg">{selectedDate}</h3>
                            <p className="text-sm text-indigo-500 font-bold">{selectedDateHebrew}</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-4">
                        {selectedDateEvents.length === 0 ? (
                            <p className="text-gray-400 text-sm italic text-right">אין אירועים ביום זה</p>
                        ) : (
                            selectedDateEvents.map(evt => (
                                <div key={evt.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-50 shadow-sm">
                                    {isCoordinator && !evt.isHoliday && (
                                        <button onClick={() => handleDeleteEvent(evt.id)} className="text-red-400 hover:text-red-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="flex-1 text-right">
                                        <div className="font-bold text-gray-800 flex items-center justify-end">
                                            {evt.title}
                                            {evt.isHoliday && <span className="mr-2 px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded-full">חג</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {isCoordinator && (
                        <div className="pt-4 border-t border-indigo-100">
                            <div className="flex gap-2">
                                <Button onClick={handleAddEvent} size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                                    הוסף אירוע
                                </Button>
                                <input
                                    type="text"
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    placeholder="אולי אימון? פעולה?.."
                                    className="flex-[2] p-2 border rounded-xl text-sm text-right focus:ring-2 focus:ring-indigo-200 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Upcoming List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-indigo-400 font-bold">5 אירועים קרובים</span>
                    <h3 className="text-lg font-black text-gray-700">מה מחכה לנו?</h3>
                </div>
                {upcomingEvents.map((evt) => (
                    <div key={evt.id} className="group flex items-center p-3 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all shadow-sm">
                        <div className={`p-3 rounded-2xl ml-4 ${evt.isHoliday ? 'bg-purple-50 text-purple-500' : 'bg-indigo-50 text-indigo-500'}`}>
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-right">
                            <div className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{evt.title}</div>
                            <div className="text-xs text-gray-400 font-medium">{evt.date} • {getHebrewDate(evt.date)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
