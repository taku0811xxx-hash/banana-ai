"use client";

import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
} from "react-simple-maps";

import { useState } from "react";
import { bananaData } from "../data/bananaData";

export default function BananaMap() {
    const [selected, setSelected] =
        useState<any>(null);

    const [hovered, setHovered] =
        useState<any>(null);

    return (
        <div className="w-full">
            <ComposableMap>
                <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                    {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                style={{
                                    default: {
                                        fill: "#F5F5F5",
                                        outline: "none",
                                    },
                                    hover: {
                                        fill: "#FFE066",
                                        outline: "none",
                                    },
                                    pressed: {
                                        fill: "#FFD43B",
                                        outline: "none",
                                    },
                                }}
                            />
                        ))
                    }
                </Geographies>

                {[
                    ...bananaData.filter(
                        (b) => b.name !== hovered?.name
                    ),
                    ...bananaData.filter(
                        (b) => b.name === hovered?.name
                    ),
                ].map((banana) => (
                    <Marker
                        key={banana.name}
                        coordinates={banana.coordinates}
                        onClick={() => setSelected(banana)}
                        onMouseEnter={() =>
                            setHovered(banana)
                        }
                        onMouseLeave={() =>
                            setHovered(null)
                        }
                    >
                        <circle
                            r={
                                hovered?.name === banana.name
                                    ? 12
                                    : 8
                            }
                            fill="#FFB703"
                            stroke="#fff"
                            strokeWidth={2}
                            className="cursor-pointer transition-all"
                        />

                        {hovered?.name === banana.name && (
                            <g>
                                {/* 背景 */}
                                <rect
                                    x={-110}
                                    y={-130}
                                    width={220}
                                    height={85}
                                    rx={18}
                                    fill="white"
                                    stroke="#e5e5e5"
                                    strokeWidth={2}
                                    style={{
                                        filter:
                                            "drop-shadow(0 6px 14px rgba(0,0,0,0.2))",
                                    }}
                                />

                                {/* 国名 */}
                                <text
                                    textAnchor="middle"
                                    y={-95}
                                    style={{
                                        fontSize: "18px",
                                        fill: "#666",
                                        fontWeight: "500",
                                    }}
                                >
                                    🌍 {banana.origin}
                                </text>

                                {/* 品種 */}
                                <text
                                    textAnchor="middle"
                                    y={-60}
                                    style={{
                                        fontSize: "22px",
                                        fontWeight: "bold",
                                        fill: "#222",
                                    }}
                                >
                                    {banana.name}
                                </text>
                            </g>
                        )}
                    </Marker>
                ))}
            </ComposableMap>

            {selected && (
                <div className="mt-6 bg-white rounded-3xl p-6 shadow-lg">
                    <p className="text-3xl font-bold">
                        🍌 {selected.name}
                    </p>

                    <p className="text-gray-600 mt-3">
                        {selected.description}
                    </p>

                    <p className="mt-4 text-sm text-gray-500">
                        原産地：{selected.origin}
                    </p>
                </div>
            )}
        </div>
    );
}