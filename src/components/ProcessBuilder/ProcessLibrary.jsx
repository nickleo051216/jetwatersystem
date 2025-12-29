import React from 'react';

// 定義可用的單元類型
const UNIT_TEMPLATES = [
    { type: 'primary', name: '初級沉澱池', icon: '📥', defaultProps: { removalRates: { BOD: 30, SS: 50 } } },
    { type: 'biology', name: '標準活性污泥池', icon: '🫧', defaultProps: { removalRates: { BOD: 85, SS: 85 } } },
    { type: 'secondary', name: '二級沉澱池', icon: '📉', defaultProps: { removalRates: { SS: 60 } } },
    { type: 'disinfection', name: '消毒池', icon: '🧪', defaultProps: { removalRates: { 大腸桿菌: 99 } } },
    { type: 'sludge', name: '污泥濃縮池', icon: '💩', defaultProps: { removalRates: {} } },
    { type: 'other', name: '調勻池', icon: '⚖️', defaultProps: { removalRates: {} } },
];

const ProcessLibrary = () => {
    const onDragStart = (event, nodeType, template) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/json', JSON.stringify(template));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full">
            <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-semibold">單元工具箱</h3>
                <p className="text-xs text-slate-400 mt-1">拖曳單元至畫布</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {['前處理', '生物處理', '固液分離', '污泥處理'].map(category => (
                    <div key={category}>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{category}</div>
                        <div className="grid grid-cols-2 gap-2">
                            {UNIT_TEMPLATES.map((unit) => (
                                <div
                                    key={unit.name}
                                    className="bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-cyan-500 cursor-grab active:cursor-grabbing flex flex-col items-center gap-2 transition-all"
                                    onDragStart={(event) => onDragStart(event, 'unit', unit)}
                                    draggable
                                >
                                    <div className="text-2xl">{unit.icon}</div>
                                    <div className="text-xs text-slate-300 text-center">{unit.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProcessLibrary;
