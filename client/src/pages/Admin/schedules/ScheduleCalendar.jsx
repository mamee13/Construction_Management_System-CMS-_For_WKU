"use client"
/* eslint-disable */
import { useState } from "react"
import { Link } from "react-router-dom"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"
import { toast } from "react-toastify"
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusIcon } from "@heroicons/react/24/outline"
import { useQuery } from "@tanstack/react-query"
// import schedulesAPI from "../../../api/schedules"
import schedulesAPI from "@/APi/schedules"

const ScheduleCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [dateSchedules, setDateSchedules] = useState([])

  // Use React Query to fetch schedules
  const { data: schedules = [], isLoading } = useQuery(
    ["schedules"],
    schedulesAPI.getAllSchedules,
    {
      onError: () => toast.error("Failed to load schedules"),
    }
  )

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const onDateClick = (day) => {
    setSelectedDate(day)

    // Find schedules for the selected date
    const schedulesForDate = schedules.filter((schedule) => {
      const start = new Date(schedule.startDate)
      const end = new Date(schedule.endDate)
      return day >= start && day <= end
    })

    setDateSchedules(schedulesForDate)
  }

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">{format(currentDate, "MMMM yyyy")}</h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    )
  }

  const renderDays = () => {
    const days = []
    const dateFormat = "EEE"
    const startDate = startOfWeek(currentDate)

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-medium text-sm text-gray-500 py-2">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      )
    }

    return <div className="grid grid-cols-7">{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ""

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d")
        const cloneDay = day

        // Check if there are schedules for this day
        const hasSchedules = schedules.some((schedule) => {
          const start = new Date(schedule.startDate)
          const end = new Date(schedule.endDate)
          return cloneDay >= start && cloneDay <= end
        })

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] border border-gray-200 p-2 ${
              !isSameMonth(day, monthStart)
                ? "bg-gray-50 text-gray-400"
                : isSameDay(day, new Date())
                ? "bg-indigo-50"
                : "bg-white"
            } ${isSameDay(day, selectedDate) ? "border-2 border-indigo-500" : ""}`}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isSameDay(day, new Date()) ? "text-indigo-600" : ""}`}>
                {formattedDate}
              </span>
              {hasSchedules && <div className="h-2 w-2 rounded-full bg-indigo-500"></div>}
            </div>
            {/* Schedule preview */}
            <div className="mt-1 space-y-1 overflow-hidden max-h-[70px]">
              {schedules
                .filter((schedule) => {
                  const start = new Date(schedule.startDate)
                  const end = new Date(schedule.endDate)
                  return cloneDay >= start && cloneDay <= end
                })
                .slice(0, 2)
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    className="text-xs p-1 rounded truncate bg-indigo-100 text-indigo-800"
                    title={schedule.title}
                  >
                    {schedule.title}
                  </div>
                ))}
              {schedules.filter((schedule) => {
                const start = new Date(schedule.startDate)
                const end = new Date(schedule.endDate)
                return cloneDay >= start && cloneDay <= end
              }).length > 2 && (
                <div className="text-xs text-gray-500">
                  +
                  {schedules.filter((schedule) => {
                    const start = new Date(schedule.startDate)
                    const end = new Date(schedule.endDate)
                    return cloneDay >= start && cloneDay <= end
                  }).length - 2}{" "}
                  more
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }

    return <div className="space-y-1">{rows}</div>
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Schedule Calendar</h1>
          <p className="mt-2 text-sm text-gray-700">View and manage schedules in a calendar format.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/admin/schedules"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <CalendarIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            List View
          </Link>
          <Link
            to="/admin/schedules/create"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Schedule
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-3/4 pr-0 md:pr-4">
                {renderHeader()}
                {renderDays()}
                {renderCells()}
              </div>

              <div className="w-full md:w-1/4 mt-6 md:mt-0 border-t md:border-t-0 md:border-l border-gray-200 pl-0 md:pl-4 pt-4 md:pt-0">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                </h3>
                {selectedDate && dateSchedules.length === 0 ? (
                  <div className="text-sm text-gray-500">No schedules for this date.</div>
                ) : (
                  <div className="space-y-4">
                    {dateSchedules.map((schedule) => (
                      <div key={schedule.id} className="border border-gray-200 rounded-md p-3">
                        <Link
                          to={`/admin/schedules/${schedule.id}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {schedule.title}
                        </Link>
                        <div className="mt-1 text-xs text-gray-500">
                          {format(new Date(schedule.startDate), "MMM d")} - {format(new Date(schedule.endDate), "MMM d, yyyy")}
                        </div>
                        <div className="mt-2">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(schedule.status)}`}>
                            {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">Project: {schedule.projectName}</div>
                        {schedule.tasks && (
                          <div className="mt-2">
                            <div className="text-xs font-medium text-gray-700">Tasks: {schedule.tasks.length}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              {schedule.tasks.filter((t) => t.status === "completed").length} completed,{" "}
                              {schedule.tasks.filter((t) => t.status === "in-progress").length} in progress
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScheduleCalendar
