"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

import type { Dashboard } from "@/types/app";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type DashboardChartProps = {
  data: Dashboard["washes_per_day"];
};

export default function DashboardChart({ data }: DashboardChartProps) {
  const labels = data.map((item) =>
    new Intl.DateTimeFormat("da-DK", { weekday: "short" }).format(new Date(item.day)),
  );
  const values = data.map((item) => item.washes);

  const options: ApexOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
    },
    colors: ["#1f8a70"],
    dataLabels: { enabled: false },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    labels: labels.length ? labels : ["Man", "Tir", "Ons", "Tor", "Fre", "Lor", "Son"],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    tooltip: {
      theme: "light",
    },
    xaxis: {
      labels: {
        style: { colors: "#687385" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      min: 0,
      labels: {
        style: { colors: "#687385" },
      },
    },
  };

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Aktivitet</p>
          <h2>Vaske seneste uge</h2>
        </div>
      </div>
      <Chart
        height={240}
        options={options}
        series={[{ name: "Vaske", data: values.length ? values : [0, 0, 0, 0, 0, 0, 0] }]}
        type="area"
      />
    </section>
  );
}
