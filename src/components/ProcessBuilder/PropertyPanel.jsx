import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

const PropertyPanel = ({ selectedNode, onUpdate, onClose }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (selectedNode) {
            setFormData(selectedNode.data);
        }
    }, [selectedNode]);

    if (!selectedNode) {
        return (
            <div className="w-80 bg-slate-900 border-l border-slate-700 p-6 flex flex-col items-center justify-center text-slate-500">
                <p>請選擇一個單元</p>
                <p className="text-xs mt-2">點擊畫布上的單元以編輯屬性</p>
            </div>
        );
    }

    const handleChange = (key, value) => {
        const newData = { ...formData, [key]: value };
        setFormData(newData);
        // 即時更新
        onUpdate(selectedNode.id, newData);
    };

    return (
        <div className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col h-full shadow-xl z-20">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    {selectedNode.type === 'source' ? '🌊 進流設定' : '⚙️ 單元參數'}
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* 基本資訊 */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">基本資訊</h4>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400">單元編號 (ID)</label>
                        <input
                            type="text"
                            value={formData.flowId || ''}
                            onChange={(e) => handleChange('flowId', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400">單元名稱</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                        />
                    </div>
                </div>

                {/* 設計參數 (依類型顯示) */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">設計參數</h4>

                    {selectedNode.type === 'source' && (
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">設計流量 (CMD)</label>
                            <input
                                type="number"
                                value={formData.flow || 0}
                                onChange={(e) => handleChange('flow', Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                            />
                        </div>
                    )}

                    {selectedNode.type === 'unit' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400">有效容積 (m³)</label>
                                <input
                                    type="number"
                                    value={formData.volume || 0}
                                    onChange={(e) => handleChange('volume', Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                                />
                            </div>
                            {/* 這裡可以根據單元類型擴充更多參數，如 HRT, 去除率等 */}
                        </>
                    )}
                </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800 text-xs text-slate-500 text-center">
                更動會即時套用至模型
            </div>
        </div>
    );
};

export default PropertyPanel;
