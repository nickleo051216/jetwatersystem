import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import ProcessLibrary from './ProcessLibrary';
import PropertyPanel from './PropertyPanel';

// 自訂節點樣式 (沿用 ReactFlowDiagram 的樣式，或者是更通用的樣式)
const UnitNode = ({ data, selected }) => {
    return (
        <div
            className={`px-4 py-3 bg-white border-2 rounded-lg shadow-md min-w-[100px] text-center transition-all ${selected ? 'border-cyan-500 shadow-cyan-200 shadow-lg' : 'border-slate-400'
                }`}
        >
            <div className="text-2xl mb-1">{data.icon || '📦'}</div>
            <div className="text-sm font-bold text-slate-700">{data.flowId}</div>
            <div className="text-xs text-slate-500">{data.name}</div>
            {data.flow && (
                <div className="text-xs text-cyan-600 mt-1 font-mono">Q = {data.flow}</div>
            )}
        </div>
    );
};

const SourceNode = ({ data, selected }) => (
    <div className={`px-3 py-2 bg-blue-50 border-2 rounded-lg shadow-md text-center ${selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-blue-400'}`}>
        <div className="text-xl">💧</div>
        <div className="text-xs font-bold text-blue-800">{data.label}</div>
    </div>
);

const nodeTypes = {
    unit: UnitNode,
    source: SourceNode,
};

const ProcessBuilder = ({ lines, setLines }) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);

    // 1. 初始化資料：將 lines 轉換為 nodes/edges
    // 注意：這裡我們暫時只處理第一條線 (Line 1)
    useEffect(() => {
        if (!lines || lines.length === 0) return;
        const line = lines[0];

        const initialNodes = [];
        const initialEdges = [];

        // 佈局參數
        const START_X = 100;
        const START_Y = 100;
        const GAP = 150;

        // 進流節點
        const sourceId = 'source-1';
        initialNodes.push({
            id: sourceId,
            type: 'source',
            position: { x: START_X, y: START_Y },
            data: { label: '進流', flow: line.designFlow },
        });

        // 單元節點
        line.units.forEach((unit, index) => {
            initialNodes.push({
                id: unit.id,
                type: 'unit',
                position: { x: START_X + (index + 1) * GAP, y: START_Y }, // 水平排列
                data: { ...unit },
            });

            // 建立連線
            const prevNodeId = index === 0 ? sourceId : line.units[index - 1].id;
            initialEdges.push({
                id: `e-${prevNodeId}-${unit.id}`,
                source: prevNodeId,
                target: unit.id,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#64748B', strokeWidth: 2 },
            });
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [lines, setNodes, setEdges]);


    // 2. 處理拖放新增單元
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const templateStr = event.dataTransfer.getData('application/json');

            if (!type || !templateStr) return;

            const template = JSON.parse(templateStr);
            const position = reactFlowWrapper.current.getBoundingClientRect();
            // 計算滑鼠在畫布上的相對位置 (需搭配 ReactFlowProvider 使用 project 函數，這裡簡化)
            // 由於我們目前採用「自動排列」策略來同步 lines，這裡的座標 Drop 後其實會被重算
            // 但為了體驗，我們先加入到 list 尾端

            // 真正的新增邏輯：更新 lines state
            setLines((prevLines) => {
                const newLines = [...prevLines];
                const targetLine = newLines[0]; // 假設操作第一條線

                const newUnit = {
                    id: uuidv4(),
                    name: template.name,
                    type: template.type,
                    icon: template.icon,
                    ...template.defaultProps,
                    flowId: `T${targetLine.units.length + 1}`,
                    additionalInlets: [],
                    inletFlow: targetLine.designFlow, // 暫時假設
                };

                targetLine.units.push(newUnit);
                return newLines;
            });
        },
        [setLines]
    );

    // 3. 處理節點點擊 -> 開啟屬性面板
    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    // 4. 處理屬性更新
    const handleNodeUpdate = (nodeId, newData) => {
        // 若是 source 節點，更新 Line 的 designFlow
        if (nodeId.startsWith('source')) {
            setLines(prev => {
                const newLines = [...prev];
                newLines[0].designFlow = newData.flow;
                return newLines;
            });
            return;
        }

        // 若是 unit 節點，更新 Unit 資料
        setLines(prev => {
            const newLines = [...prev];
            const line = newLines[0];
            const unitIndex = line.units.findIndex(u => u.id === nodeId);
            if (unitIndex !== -1) {
                line.units[unitIndex] = { ...line.units[unitIndex], ...newData };
            }
            return newLines;
        });

        // 同時更新本地選取狀態以反映 UI
        setSelectedNode(prev => ({ ...prev, data: newData }));
    };

    return (
        <div className="flex h-[750px] w-full border border-slate-700 rounded-xl overflow-hidden bg-slate-50">
            <ReactFlowProvider>
                {/* 左側工具箱 */}
                <ProcessLibrary />

                {/* 中間畫布 */}
                <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background color="#cbd5e1" gap={20} />
                        <Controls />
                        <MiniMap />
                    </ReactFlow>
                </div>

                {/* 右側屬性面板 (有選取時才顯示) */}
                {selectedNode && (
                    <PropertyPanel
                        selectedNode={selectedNode}
                        onUpdate={handleNodeUpdate}
                        onClose={() => setSelectedNode(null)}
                    />
                )}
            </ReactFlowProvider>
        </div>
    );
};

export default ProcessBuilder;
