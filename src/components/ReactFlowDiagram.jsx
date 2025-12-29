import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// 自訂節點樣式
const UnitNode = ({ data }) => {
    return (
        <div
            className="px-4 py-3 bg-white border-2 border-slate-400 rounded-lg shadow-md min-w-[100px] text-center"
            style={{ borderColor: data.borderColor || '#64748B' }}
        >
            <div className="text-xs font-bold text-slate-700">{data.flowId}</div>
            <div className="text-sm font-medium text-slate-900">{data.name}</div>
            {data.flow && (
                <div className="text-xs text-cyan-600 mt-1">Q = {data.flow} CMD</div>
            )}
        </div>
    );
};

// 進流來源節點
const SourceNode = ({ data }) => {
    return (
        <div className="px-3 py-2 bg-blue-100 border-2 border-blue-500 rounded-lg shadow-md text-center">
            <div className="text-xs font-bold text-blue-800">{data.label}</div>
            <div className="text-xs text-blue-600">{data.flow} CMD</div>
        </div>
    );
};

// 進流標籤節點
const InletNode = ({ data }) => {
    return (
        <div className="px-3 py-2 bg-sky-50 border border-sky-400 rounded shadow-sm min-w-[110px]">
            <div className="text-xs text-sky-700">{data.flowId}</div>
            <div className="text-sm font-bold text-sky-800">Q = {data.flow} CMD</div>
        </div>
    );
};

// 放流節點
const DischargeNode = ({ data }) => {
    return (
        <div className="px-4 py-3 bg-emerald-50 border-2 border-emerald-500 rounded-lg shadow-md text-center">
            <div className="text-lg">🌊</div>
            <div className="text-sm font-bold text-emerald-700">放流</div>
        </div>
    );
};

// 節點類型映射
const nodeTypes = {
    unit: UnitNode,
    source: SourceNode,
    inlet: InletNode,
    discharge: DischargeNode,
};

/**
 * ReactFlowDiagram - 可拖曳的工程流程圖
 */
const ReactFlowDiagram = ({ lines }) => {
    // 將 lines 資料轉換為 React Flow 的 nodes 和 edges
    const { initialNodes, initialEdges } = useMemo(() => {
        if (!lines || lines.length === 0) {
            return { initialNodes: [], initialEdges: [] };
        }

        const nodes = [];
        const edges = [];
        const line = lines[0]; // 目前只處理第一條線
        const units = line.units || [];

        // 佈局常數
        const UNIT_X = 350;
        const INLET_X = 100;
        const START_Y = 100;
        const Y_GAP = 120;

        // 1. 進流來源節點
        nodes.push({
            id: 'source',
            type: 'source',
            position: { x: INLET_X, y: START_Y - 60 },
            data: { label: 'WM01', flow: line.designFlow },
            draggable: true,
        });

        // 2. 單元節點與進流標籤
        units.forEach((unit, index) => {
            const yPos = START_Y + index * Y_GAP;

            // 單元節點
            nodes.push({
                id: unit.id,
                type: 'unit',
                position: { x: UNIT_X, y: yPos },
                data: {
                    flowId: unit.flowId || `T${index + 1}`,
                    name: unit.name,
                    flow: unit.inletFlow,
                    borderColor: '#0EA5E9',
                },
                draggable: true,
            });

            // 進流標籤節點
            nodes.push({
                id: `inlet-${unit.id}`,
                type: 'inlet',
                position: { x: INLET_X, y: yPos + 10 },
                data: {
                    flowId: unit.inletFlowId || `WTB-${index + 1}`,
                    flow: unit.inletFlow || line.designFlow,
                },
                draggable: true,
            });

            // 進流標籤 -> 單元 連線
            edges.push({
                id: `inlet-edge-${unit.id}`,
                source: `inlet-${unit.id}`,
                target: unit.id,
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#0EA5E9', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#0EA5E9' },
            });

            // 單元之間的連線
            if (index > 0) {
                const prevUnit = units[index - 1];
                edges.push({
                    id: `edge-${prevUnit.id}-${unit.id}`,
                    source: prevUnit.id,
                    target: unit.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#10B981', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' },
                });
            }

            // 來源 -> 第一個單元
            if (index === 0) {
                edges.push({
                    id: 'source-to-first',
                    source: 'source',
                    target: unit.id,
                    type: 'smoothstep',
                    animated: false,
                    style: { stroke: '#3B82F6', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
                });
            }
        });

        // 3. 放流節點
        if (units.length > 0) {
            const lastY = START_Y + (units.length - 1) * Y_GAP;
            nodes.push({
                id: 'discharge',
                type: 'discharge',
                position: { x: UNIT_X + 20, y: lastY + Y_GAP },
                data: {},
                draggable: true,
            });

            // 最後單元 -> 放流
            edges.push({
                id: 'last-to-discharge',
                source: units[units.length - 1].id,
                target: 'discharge',
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#10B981', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#10B981' },
            });
        }

        return { initialNodes: nodes, initialEdges: edges };
    }, [lines]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    if (!lines || lines.length === 0 || initialNodes.length === 0) {
        return (
            <div className="text-center py-20 text-slate-500">
                尚未建立任何處理線
            </div>
        );
    }

    return (
        <div className="w-full h-[700px] bg-white rounded-xl border border-slate-300 overflow-hidden">
            {/* 圖例 */}
            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md text-xs text-slate-600">
                <div className="font-bold mb-2">【以設計值 100% 呈現】</div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-4 h-0.5 bg-green-500"></span> 廢水流向
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-4 h-0.5 bg-blue-500"></span> 進流來源
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-orange-500 border-dashed"></span> 污泥流向
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
            >
                <Background color="#E2E8F0" gap={20} />
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        if (node.type === 'source') return '#3B82F6';
                        if (node.type === 'discharge') return '#10B981';
                        if (node.type === 'inlet') return '#0EA5E9';
                        return '#64748B';
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                />
            </ReactFlow>
        </div>
    );
};

export default ReactFlowDiagram;
