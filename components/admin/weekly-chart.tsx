"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PatientsByWeek {
  week: string
  count: number
  startDate: string
  endDate: string
}

interface WeeklyChartProps {
  data: PatientsByWeek[]
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const weekData = data.find((item) => item.week === label)
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">
            {weekData?.startDate} - {weekData?.endDate}
          </p>
          <p className="text-blue-600 font-medium">{payload[0].value} pacientes</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="count" name="Pacientes" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
