import React from 'react';

/**
 * ProcessFlowDiagram - 工程流程圖元件
 * 仿照標準的污水處理廠流程圖（PFD）樣式
 */
const ProcessFlowDiagram = ({ lines, width = 1200, height = 1600 }) => {
    if (!lines || lines.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500">
                尚未建立任何處理線
            </div>
        );
    }

    // 取得第一條處理線的資料
    const line = lines[0];
    const units = line.units || [];

    // 佈局常數
    const UNIT_WIDTH = 100;
    const UNIT_HEIGHT = 40;
    const VERTICAL_GAP = 60;
    const LEFT_MARGIN = 180;
    const TOP_MARGIN = 80;
    const INLET_BOX_WIDTH = 120;
    const INLET_BOX_HEIGHT = 50;

    // 計算單元位置
    const getUnitPosition = (index) => ({
        x: LEFT_MARGIN,
        y: TOP_MARGIN + index * (UNIT_HEIGHT + VERTICAL_GAP),
    });

    // 繪製單元方框
    const renderUnit = (unit, index) => {
        const pos = getUnitPosition(index);
        return (
            <g key={unit.id}>
                {/* 單元方框 */}
                <rect
                    x={pos.x}
                    y={pos.y}
                    width={UNIT_WIDTH}
                    height={UNIT_HEIGHT}
                    fill="white"
                    stroke="#333"
                    strokeWidth={1}
                    rx={2}
                />
                {/* 單元編號 */}
                <text
                    x={pos.x + UNIT_WIDTH / 2}
                    y={pos.y + 14}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight="bold"
                    fill="#333"
                >
                    {unit.flowId || `T0${index + 1}`}
                </text>
                {/* 單元名稱 */}
                <text
                    x={pos.x + UNIT_WIDTH / 2}
                    y={pos.y + 28}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#555"
                >
                    {unit.name}
                </text>
            </g>
        );
    };

    // 繪製進流標示方框（左側）
    const renderInletLabel = (unit, index) => {
        const pos = getUnitPosition(index);
        const inletX = pos.x - INLET_BOX_WIDTH - 20;
        const inletY = pos.y - 5;

        return (
            <g key={`inlet-${unit.id}`}>
                {/* 進流方框 */}
                <rect
                    x={inletX}
                    y={inletY}
                    width={INLET_BOX_WIDTH}
                    height={INLET_BOX_HEIGHT}
                    fill="#F0F9FF"
                    stroke="#0EA5E9"
                    strokeWidth={1}
                    rx={3}
                />
                {/* 進流編號 */}
                <text
                    x={inletX + 5}
                    y={inletY + 15}
                    fontSize={9}
                    fill="#0369A1"
                >
                    {unit.inletFlowId || `WTB01-${String(index + 1).padStart(2, '0')}-1`}
                </text>
                {/* 流量 */}
                <text
                    x={inletX + 5}
                    y={inletY + 30}
                    fontSize={10}
                    fontWeight="bold"
                    fill="#0369A1"
                >
                    Q = {unit.inletFlow || line.designFlow} CMD
                </text>
                {/* 連接線 */}
                <line
                    x1={inletX + INLET_BOX_WIDTH}
                    y1={inletY + INLET_BOX_HEIGHT / 2}
                    x2={pos.x}
                    y2={pos.y + UNIT_HEIGHT / 2}
                    stroke="#0EA5E9"
                    strokeWidth={1.5}
                    markerEnd="url(#arrowBlue)"
                />
            </g>
        );
    };

    // 繪製單元之間的連接線
    const renderConnection = (fromIndex, toIndex) => {
        const from = getUnitPosition(fromIndex);
        const to = getUnitPosition(toIndex);

        return (
            <line
                key={`conn-${fromIndex}-${toIndex}`}
                x1={from.x + UNIT_WIDTH / 2}
                y1={from.y + UNIT_HEIGHT}
                x2={to.x + UNIT_WIDTH / 2}
                y2={to.y}
                stroke="#10B981"
                strokeWidth={2}
                markerEnd="url(#arrowGreen)"
            />
        );
    };

    // 繪製污泥回流線（虛線）
    const renderSludgeLine = (fromIndex, label) => {
        const from = getUnitPosition(fromIndex);
        const sludgeX = LEFT_MARGIN + UNIT_WIDTH + 150;
        const sludgeY = from.y + UNIT_HEIGHT / 2;

        return (
            <g key={`sludge-${fromIndex}`}>
                {/* 水平虛線 */}
                <line
                    x1={from.x + UNIT_WIDTH}
                    y1={from.y + UNIT_HEIGHT / 2}
                    x2={sludgeX}
                    y2={sludgeY}
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    strokeDasharray="5,3"
                    markerEnd="url(#arrowOrange)"
                />
                {/* 標籤 */}
                <text
                    x={sludgeX + 10}
                    y={sludgeY + 4}
                    fontSize={9}
                    fill="#D97706"
                >
                    {label || '污泥'}
                </text>
            </g>
        );
    };

    // 繪製化學加藥標示
    const renderChemicalDosing = (unit, index) => {
        if (!unit.additionalInlets || unit.additionalInlets.length === 0) return null;

        const pos = getUnitPosition(index);

        return unit.additionalInlets
            .filter((inlet) => inlet.type === '化學藥劑')
            .map((inlet, inletIdx) => {
                const chemX = pos.x + UNIT_WIDTH + 20;
                const chemY = pos.y + 10 + inletIdx * 15;

                return (
                    <g key={`chem-${inlet.id}`}>
                        <line
                            x1={pos.x + UNIT_WIDTH}
                            y1={pos.y + UNIT_HEIGHT / 2}
                            x2={chemX - 5}
                            y2={chemY}
                            stroke="#EC4899"
                            strokeWidth={1}
                            strokeDasharray="3,2"
                        />
                        <text x={chemX} y={chemY + 4} fontSize={8} fill="#DB2777">
                            {inlet.name} ({inlet.flow} CMD)
                        </text>
                    </g>
                );
            });
    };

    // 計算 SVG 高度
    const svgHeight = Math.max(height, TOP_MARGIN + units.length * (UNIT_HEIGHT + VERTICAL_GAP) + 100);

    return (
        <div className="w-full overflow-auto bg-white p-4 rounded-xl border border-slate-300">
            {/* 圖例 */}
            <div className="flex gap-6 mb-4 text-xs text-slate-600 justify-end pr-4">
                <span className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-green-500"></span> 廢水流向
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-orange-500 border-dashed border-t-2 border-orange-500"></span> 污泥流向
                </span>
                <span className="flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-pink-500 border-dashed border-t border-pink-500"></span> 化學藥劑
                </span>
            </div>

            {/* 標題 */}
            <div className="text-center mb-4 text-slate-700 font-semibold">
                {line.name} - 流程圖 【以設計值 100% 呈現】
            </div>

            <svg width={width} height={svgHeight} className="mx-auto">
                {/* 箭頭定義 */}
                <defs>
                    <marker
                        id="arrowGreen"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path d="M0,0 L0,6 L9,3 z" fill="#10B981" />
                    </marker>
                    <marker
                        id="arrowBlue"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path d="M0,0 L0,6 L9,3 z" fill="#0EA5E9" />
                    </marker>
                    <marker
                        id="arrowOrange"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path d="M0,0 L0,6 L9,3 z" fill="#F59E0B" />
                    </marker>
                </defs>

                {/* 進流來源標示 */}
                <g>
                    <rect x={20} y={TOP_MARGIN - 30} width={80} height={35} fill="#DBEAFE" stroke="#3B82F6" rx={3} />
                    <text x={60} y={TOP_MARGIN - 18} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#1E40AF">
                        WM01
                    </text>
                    <text x={60} y={TOP_MARGIN - 5} textAnchor="middle" fontSize={8} fill="#1E40AF">
                        {line.designFlow} CMD
                    </text>
                </g>

                {/* 進流連接到第一個單元 */}
                {units.length > 0 && (
                    <line
                        x1={100}
                        y1={TOP_MARGIN - 12}
                        x2={LEFT_MARGIN}
                        y2={TOP_MARGIN + UNIT_HEIGHT / 2}
                        stroke="#3B82F6"
                        strokeWidth={2}
                        markerEnd="url(#arrowBlue)"
                    />
                )}

                {/* 渲染所有單元 */}
                {units.map((unit, index) => (
                    <React.Fragment key={unit.id}>
                        {renderUnit(unit, index)}
                        {renderInletLabel(unit, index)}
                        {index < units.length - 1 && renderConnection(index, index + 1)}
                        {renderChemicalDosing(unit, index)}
                    </React.Fragment>
                ))}

                {/* 示範：二沉池污泥回流 */}
                {units.length > 4 && renderSludgeLine(4, '迴流污泥(RAS)')}
                {units.length > 6 && renderSludgeLine(6, '廢棄污泥(WAS)')}

                {/* 放流標示 */}
                {units.length > 0 && (
                    <g>
                        {(() => {
                            const lastPos = getUnitPosition(units.length - 1);
                            const dischargeY = lastPos.y + UNIT_HEIGHT + 40;
                            return (
                                <>
                                    <line
                                        x1={lastPos.x + UNIT_WIDTH / 2}
                                        y1={lastPos.y + UNIT_HEIGHT}
                                        x2={lastPos.x + UNIT_WIDTH / 2}
                                        y2={dischargeY}
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        markerEnd="url(#arrowGreen)"
                                    />
                                    <rect
                                        x={lastPos.x - 10}
                                        y={dischargeY}
                                        width={UNIT_WIDTH + 20}
                                        height={30}
                                        fill="#ECFDF5"
                                        stroke="#10B981"
                                        rx={3}
                                    />
                                    <text
                                        x={lastPos.x + UNIT_WIDTH / 2}
                                        y={dischargeY + 20}
                                        textAnchor="middle"
                                        fontSize={11}
                                        fontWeight="bold"
                                        fill="#047857"
                                    >
                                        🌊 放流
                                    </text>
                                </>
                            );
                        })()}
                    </g>
                )}
            </svg>
        </div>
    );
};

export default ProcessFlowDiagram;
