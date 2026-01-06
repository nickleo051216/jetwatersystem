import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, FileText, Download, Building2, Droplets, ArrowRight, Check, X, Edit2, RotateCcw, Link, Unlink, Activity } from 'lucide-react';
import ProcessFlowDiagram from './components/ProcessFlowDiagram';
import ReactFlowDiagram from './components/ReactFlowDiagram';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================
// 事業類別與申報項目資料庫
// ============================================
const BUSINESS_TYPES = {
  "製糖業": { id: 1, generalItems: ["pH", "水溫", "BOD", "COD", "SS"], specificItems1: [], specificItems2: [] },
  "紡織業": { id: 2, generalItems: ["pH", "水溫", "BOD", "COD", "SS", "真色色度", "自由有效餘氯"], specificItems1: [], specificItems2: [] },
  "電鍍業": { id: 19, generalItems: ["pH", "水溫", "COD", "SS", "氨氮"], specificItems1: ["總鉻", "鎘", "鎳", "銅", "總汞", "鉛", "砷", "鋅", "氰化物", "硝酸鹽氮", "氟鹽"], specificItems2: ["六價鉻", "硼", "錫", "鉬"] },
  "晶圓製造及半導體製造業": { id: 20, generalItems: ["pH", "水溫", "COD", "SS", "氨氮", "總磷"], specificItems1: ["總鉻", "鎘", "鎳", "銅", "總汞", "鉛", "砷", "鋅", "氰化物", "硝酸鹽氮", "氟鹽", "陰離子界面活性劑"], specificItems2: ["六價鉻", "硼", "錫", "鉬"] },
  "食品製造業": { id: 42, generalItems: ["pH", "水溫", "BOD", "COD", "SS"], specificItems1: ["油脂"], specificItems2: [] },
  "餐飲業、觀光旅館(飯店)": { id: 55, generalItems: ["pH", "水溫", "BOD", "COD", "SS", "大腸桿菌群", "總氮", "總磷"], specificItems1: ["油脂"], specificItems2: [] },
  "醫院、醫事機構": { id: 53, generalItems: ["pH", "水溫", "BOD", "COD", "SS", "大腸桿菌群", "自由有效餘氯", "氨氮"], specificItems1: [], specificItems2: [] },
  "公共污水下水道": { id: 63, generalItems: ["pH", "水溫", "BOD", "COD", "SS", "大腸桿菌群", "自由有效餘氯", "總氮", "氨氮", "總磷"], specificItems1: [], specificItems2: [] },
  "社區專用污水下水道": { id: 64, generalItems: ["pH", "水溫", "BOD", "SS", "大腸桿菌群"], specificItems1: [], specificItems2: [] },
  "其他（自訂）": { id: 99, generalItems: ["pH", "水溫", "BOD", "COD", "SS"], specificItems1: [], specificItems2: [] }
};

// 各項目預設濃度
const DEFAULT_CONCENTRATIONS = {
  "pH": { value: "6-9", unit: "-", isRange: true },
  "水溫": { value: 25, unit: "℃", isRange: false },
  "BOD": { value: 200, unit: "mg/L", isRange: false },
  "COD": { value: 350, unit: "mg/L", isRange: false },
  "SS": { value: 250, unit: "mg/L", isRange: false },
  "氨氮": { value: 30, unit: "mg/L", isRange: false },
  "總氮": { value: 40, unit: "mg/L", isRange: false },
  "總磷": { value: 8, unit: "mg/L", isRange: false },
  "真色色度": { value: 100, unit: "ADMI", isRange: false },
  "自由有效餘氯": { value: 1, unit: "mg/L", isRange: false },
  "大腸桿菌群": { value: 200000, unit: "CFU/100mL", isRange: false },
  "油脂": { value: 30, unit: "mg/L", isRange: false },
  "陰離子界面活性劑": { value: 10, unit: "mg/L", isRange: false },
  "硝酸鹽氮": { value: 10, unit: "mg/L", isRange: false },
  "氟鹽": { value: 5, unit: "mg/L", isRange: false },
  "氰化物": { value: 0.5, unit: "mg/L", isRange: false },
  "總鉻": { value: 1, unit: "mg/L", isRange: false },
  "六價鉻": { value: 0.5, unit: "mg/L", isRange: false },
  "鎘": { value: 0.03, unit: "mg/L", isRange: false },
  "鎳": { value: 1, unit: "mg/L", isRange: false },
  "銅": { value: 3, unit: "mg/L", isRange: false },
  "總汞": { value: 0.005, unit: "mg/L", isRange: false },
  "鉛": { value: 1, unit: "mg/L", isRange: false },
  "砷": { value: 0.5, unit: "mg/L", isRange: false },
  "鋅": { value: 5, unit: "mg/L", isRange: false },
  "硼": { value: 1, unit: "mg/L", isRange: false },
  "錫": { value: 1, unit: "mg/L", isRange: false },
  "鉬": { value: 0.6, unit: "mg/L", isRange: false }
};

// 處理單元類型與預設削減率
const UNIT_TYPES = {
  "進流": { icon: "🚰", removalRates: {}, description: "原廢水進流點" },
  "攔污柵": { icon: "🔲", removalRates: { SS: 5 }, description: "去除大型固體物" },
  "沉砂池": { icon: "⬇️", removalRates: { SS: 5 }, description: "去除砂粒" },
  "調勻池": { icon: "🔄", removalRates: {}, description: "均化水質水量" },
  "初級沉澱池": { icon: "📥", removalRates: { BOD: 30, SS: 50, COD: 25, 總磷: 10 }, description: "去除可沉降固體" },
  "標準活性污泥池": { icon: "🫧", removalRates: { BOD: 85, SS: 85, COD: 80, 氨氮: 30, 總氮: 20, 總磷: 20 }, description: "好氧生物處理" },
  "延長曝氣池": { icon: "💨", removalRates: { BOD: 90, SS: 90, COD: 85, 氨氮: 85, 總氮: 30, 總磷: 25 }, description: "長時間曝氣處理" },
  "A2O生物池": { icon: "🔁", removalRates: { BOD: 90, SS: 90, COD: 85, 氨氮: 90, 總氮: 70, 總磷: 80 }, description: "厭氧-缺氧-好氧去氮除磷" },
  "SBR反應槽": { icon: "⏱️", removalRates: { BOD: 90, SS: 90, COD: 85, 氨氮: 85, 總氮: 60, 總磷: 50 }, description: "序批式活性污泥" },
  "MBR膜生物反應器": { icon: "🔬", removalRates: { BOD: 95, SS: 99, COD: 90, 氨氮: 95, 總氮: 70, 總磷: 85, 大腸桿菌群: 99.9 }, description: "膜過濾生物處理" },
  "二級沉澱池": { icon: "📤", removalRates: { SS: 90, BOD: 5, COD: 5 }, description: "生物污泥沉澱分離" },
  "快濾池": { icon: "🧫", removalRates: { SS: 50, 總磷: 20 }, description: "過濾去除殘餘SS" },
  "加藥混凝池": { icon: "🧪", removalRates: { SS: 60, 總磷: 70, 真色色度: 50 }, description: "化學混凝沉降" },
  "消毒池": { icon: "☀️", removalRates: { 大腸桿菌群: 99.9, BOD: 5, COD: 5 }, description: "消毒殺菌" },
  "放流": { icon: "🌊", removalRates: {}, description: "處理水放流點" },
  "自訂單元": { icon: "⚙️", removalRates: {}, description: "自訂處理單元" }
};

// 額外進流類型
const INLET_TYPES = {
  "RAS": { icon: "🔄", name: "迴流污泥 (RAS)", description: "Return Activated Sludge", defaultFlow: 300 },
  "化學藥劑": { icon: "🧪", name: "化學藥劑", description: "PAC、聚合物、NaOH等", defaultFlow: 10 },
  "上清液": { icon: "💧", name: "上清液", description: "污泥濃縮/脫水上清液", defaultFlow: 50 },
  "其他處理線": { icon: "🔀", name: "其他處理線", description: "來自其他處理線的水流", defaultFlow: 100 },
  "自訂": { icon: "📝", name: "自訂進流", description: "自訂名稱與水質", defaultFlow: 0 }
};

// ============================================
// 主應用程式
// ============================================
// localStorage 儲存 keys
const PROJECTS_INDEX_KEY = 'wastewater-projects-index';
const PROJECT_DATA_PREFIX = 'wastewater-project-';

export default function WastewaterCalculator() {
  // ============================================
  // 專案管理狀態
  // ============================================
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showProjectList, setShowProjectList] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  // 載入專案索引
  useEffect(() => {
    try {
      const indexData = localStorage.getItem(PROJECTS_INDEX_KEY);
      if (indexData) {
        const parsed = JSON.parse(indexData);
        setProjects(parsed.projects || []);
        // 如果有 activeProjectId，自動載入該專案
        if (parsed.activeProjectId) {
          loadProject(parsed.activeProjectId, parsed.projects || []);
        }
      }
      // 遷移舊資料（如果存在）
      const oldData = localStorage.getItem('wastewater-calculator-data');
      if (oldData && (!indexData || JSON.parse(indexData).projects.length === 0)) {
        migrateOldData(JSON.parse(oldData));
      }
    } catch (e) {
      console.error('載入專案索引失敗:', e);
    }
  }, []);

  // 遷移舊版資料到新架構
  const migrateOldData = (oldData) => {
    const newProjectId = `proj-${Date.now()}`;
    const newProject = {
      id: newProjectId,
      name: oldData.facilityName || '未命名專案',
      businessType: oldData.businessType || '',
      createdAt: oldData.savedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 儲存專案資料
    localStorage.setItem(`${PROJECT_DATA_PREFIX}${newProjectId}`, JSON.stringify({
      facilityName: oldData.facilityName || '',
      businessType: oldData.businessType || '',
      designFlow: oldData.designFlow || 1000,
      reportItems: oldData.reportItems || [],
      lines: oldData.lines || [],
      currentStep: oldData.currentStep || 1
    }));

    // 更新專案索引
    const newProjects = [newProject];
    setProjects(newProjects);
    saveProjectsIndex(newProjects, newProjectId);

    // 載入這個專案
    loadProject(newProjectId, newProjects);

    // 刪除舊資料
    localStorage.removeItem('wastewater-calculator-data');
  };

  // 儲存專案索引
  const saveProjectsIndex = (projectsList, activeId = activeProjectId) => {
    try {
      localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify({
        projects: projectsList,
        activeProjectId: activeId
      }));
    } catch (e) {
      console.error('儲存專案索引失敗:', e);
    }
  };

  // ============================================
  // 專案內容狀態
  // ============================================
  const [currentStep, setCurrentStep] = useState(1);
  const [facilityName, setFacilityName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [designFlow, setDesignFlow] = useState(1000);
  const [reportItems, setReportItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  // 新增項目狀態
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('mg/L');
  const [newItemConc, setNewItemConc] = useState(0);

  // 新增進流 Modal 狀態
  const [showInletModal, setShowInletModal] = useState(false);

  // 圖表類型切換狀態
  const [diagramType, setDiagramType] = useState('reactflow');

  // 自動儲存當前專案到 localStorage
  useEffect(() => {
    if (!activeProjectId) return;

    const dataToSave = {
      currentStep,
      facilityName,
      businessType,
      designFlow,
      reportItems,
      lines,
      savedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(`${PROJECT_DATA_PREFIX}${activeProjectId}`, JSON.stringify(dataToSave));
      // 更新專案索引中的名稱和時間
      const updatedProjects = projects.map(p =>
        p.id === activeProjectId
          ? { ...p, name: facilityName || '未命名專案', businessType, updatedAt: new Date().toISOString() }
          : p
      );
      if (JSON.stringify(updatedProjects) !== JSON.stringify(projects)) {
        setProjects(updatedProjects);
        saveProjectsIndex(updatedProjects);
      }
    } catch (e) {
      console.error('儲存專案資料失敗:', e);
    }
  }, [currentStep, facilityName, businessType, designFlow, reportItems, lines, activeProjectId]);

  // 載入專案
  const loadProject = (projectId, projectsList = projects) => {
    try {
      const projectData = localStorage.getItem(`${PROJECT_DATA_PREFIX}${projectId}`);
      if (projectData) {
        const data = JSON.parse(projectData);
        setCurrentStep(data.currentStep || 1);
        setFacilityName(data.facilityName || '');
        setBusinessType(data.businessType || '');
        setDesignFlow(data.designFlow || 1000);
        setReportItems(data.reportItems || []);
        setLines(data.lines || []);
        setSelectedLineId(null);
        setSelectedUnitId(null);
        setActiveProjectId(projectId);
        setShowProjectList(false);
        saveProjectsIndex(projectsList, projectId);
      }
    } catch (e) {
      console.error('載入專案失敗:', e);
    }
  };

  // 建立新專案
  const createNewProject = () => {
    if (!newProjectName.trim()) {
      alert('請輸入專案名稱');
      return;
    }

    const newProjectId = `proj-${Date.now()}`;
    const newProject = {
      id: newProjectId,
      name: newProjectName.trim(),
      businessType: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 初始化空專案資料
    localStorage.setItem(`${PROJECT_DATA_PREFIX}${newProjectId}`, JSON.stringify({
      facilityName: newProjectName.trim(),
      businessType: '',
      designFlow: 1000,
      reportItems: [],
      lines: [],
      currentStep: 1
    }));

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    saveProjectsIndex(updatedProjects, newProjectId);

    // 重置表單
    setNewProjectName('');
    setShowNewProjectForm(false);

    // 載入新專案
    loadProject(newProjectId, updatedProjects);
  };

  // 刪除專案
  const deleteProject = (projectId, e) => {
    e.stopPropagation();
    const project = projects.find(p => p.id === projectId);
    if (!window.confirm(`確定要刪除專案「${project?.name}」嗎？此操作無法復原！`)) return;

    // 刪除專案資料
    localStorage.removeItem(`${PROJECT_DATA_PREFIX}${projectId}`);

    // 更新專案索引
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);

    // 如果刪除的是當前專案，回到專案列表
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setShowProjectList(true);
      saveProjectsIndex(updatedProjects, null);
    } else {
      saveProjectsIndex(updatedProjects);
    }
  };

  // 返回專案列表
  const backToProjectList = () => {
    setShowProjectList(true);
  };

  // 清除所有資料（所有專案）
  const clearAllData = () => {
    if (!window.confirm('確定要清除所有專案資料嗎？此操作無法復原！')) return;

    // 刪除所有專案資料
    projects.forEach(p => {
      localStorage.removeItem(`${PROJECT_DATA_PREFIX}${p.id}`);
    });
    localStorage.removeItem(PROJECTS_INDEX_KEY);

    setProjects([]);
    setActiveProjectId(null);
    setShowProjectList(true);
    setCurrentStep(1);
    setFacilityName('');
    setBusinessType('');
    setDesignFlow(1000);
    setReportItems([]);
    setLines([]);
  };

  // 當選擇事業類別時，自動帶入申報項目
  const handleBusinessTypeChange = (type) => {
    setBusinessType(type);
    if (type && BUSINESS_TYPES[type]) {
      const bt = BUSINESS_TYPES[type];
      const items = [
        ...bt.generalItems.map(name => ({
          id: `gen-${name}`, name, category: '一般水質', frequency: '每三個月',
          concentration: DEFAULT_CONCENTRATIONS[name]?.value || 0,
          unit: DEFAULT_CONCENTRATIONS[name]?.unit || 'mg/L',
          isRange: DEFAULT_CONCENTRATIONS[name]?.isRange || false, enabled: true
        })),
        ...bt.specificItems1.map(name => ({
          id: `sp1-${name}`, name, category: '特定水質(一)', frequency: '每六個月',
          concentration: DEFAULT_CONCENTRATIONS[name]?.value || 0,
          unit: DEFAULT_CONCENTRATIONS[name]?.unit || 'mg/L',
          isRange: DEFAULT_CONCENTRATIONS[name]?.isRange || false, enabled: true
        })),
        ...bt.specificItems2.map(name => ({
          id: `sp2-${name}`, name, category: '特定水質(二)', frequency: '每年',
          concentration: DEFAULT_CONCENTRATIONS[name]?.value || 0,
          unit: DEFAULT_CONCENTRATIONS[name]?.unit || 'mg/L',
          isRange: DEFAULT_CONCENTRATIONS[name]?.isRange || false, enabled: true
        }))
      ];
      setReportItems(items);
    }
  };

  // 新增自訂申報項目
  const addCustomItem = () => {
    if (newItemName.trim()) {
      const newItem = {
        id: `custom-${Date.now()}`,
        name: newItemName.trim(),
        category: '自訂項目',
        frequency: '每六個月',
        concentration: newItemConc,
        unit: newItemUnit,
        isRange: false,
        enabled: true
      };
      setReportItems([...reportItems, newItem]);
      setNewItemName('');
      setNewItemConc(0);
      setShowAddItem(false);
    }
  };

  // 新增處理線
  const addLine = () => {
    const newLine = {
      id: `line-${Date.now()}`,
      name: `處理線 ${String.fromCharCode(65 + lines.length)}`,
      designFlow: designFlow,
      units: []
    };
    setLines([...lines, newLine]);
    setSelectedLineId(newLine.id);
  };

  // 更新處理線名稱
  const updateLineName = (lineId, newName) => {
    setLines(lines.map(line => line.id === lineId ? { ...line, name: newName } : line));
  };

  // 更新處理線流量
  const updateLineFlow = (lineId, flow) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        const updatedUnits = line.units.map(unit => {
          if (unit.flowInherited) {
            return { ...unit, inletFlow: Number(flow), outletFlow: Number(flow) };
          }
          return unit;
        });
        return { ...line, designFlow: Number(flow), units: updatedUnits };
      }
      return line;
    }));
  };

  // 刪除處理線
  const removeLine = (lineId) => {
    setLines(lines.filter(l => l.id !== lineId));
    if (selectedLineId === lineId) { setSelectedLineId(null); setSelectedUnitId(null); }
  };

  // 新增單元到處理線
  const addUnit = (lineId, unitType) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        const unitConfig = UNIT_TYPES[unitType];
        const unitIndex = line.units.length + 1;
        const newUnit = {
          id: `unit-${Date.now()}`,
          type: unitType,
          name: unitType === '自訂單元' ? `自訂單元 ${unitIndex}` : unitType,
          icon: unitConfig.icon,
          flowId: `T${unitIndex}`,
          inletFlowId: line.units.length > 0 ? `WTB-${unitIndex}` : 'WTB-進流',
          outletFlowId: `WTA-${unitIndex}`,
          flowInherited: true,
          inletFlow: line.designFlow,
          outletFlow: line.designFlow,
          removalRates: { ...unitConfig.removalRates },
          concentrations: {},
          additionalInlets: []
        };

        reportItems.filter(item => item.enabled).forEach(item => {
          const prevUnit = line.units[line.units.length - 1];
          const inletConc = prevUnit ? (prevUnit.concentrations[item.name]?.outlet || item.concentration) : item.concentration;
          const removalRate = newUnit.removalRates[item.name] || 0;
          const outletConc = item.isRange ? inletConc : Number((inletConc * (1 - removalRate / 100)).toFixed(3));
          newUnit.concentrations[item.name] = { inlet: inletConc, outlet: outletConc, removalRate };
        });

        return { ...line, units: [...line.units, newUnit] };
      }
      return line;
    }));
  };

  // 刪除單元
  const removeUnit = (lineId, unitId) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return { ...line, units: line.units.filter(u => u.id !== unitId) };
      }
      return line;
    }));
    if (selectedUnitId === unitId) setSelectedUnitId(null);
  };

  // 更新單元名稱
  const updateUnitName = (lineId, unitId, newName) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return { ...line, units: line.units.map(unit => unit.id === unitId ? { ...unit, name: newName } : unit) };
      }
      return line;
    }));
  };

  // 更新進出水編號
  const updateFlowId = (lineId, unitId, field, newId) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          units: line.units.map(unit => unit.id === unitId ? { ...unit, [field]: newId } : unit)
        };
      }
      return line;
    }));
  };

  // 切換流量繼承
  const toggleFlowInheritance = (lineId, unitId) => {
    const line = lines.find(l => l.id === lineId);
    setLines(lines.map(l => {
      if (l.id === lineId) {
        return {
          ...l,
          units: l.units.map(unit => {
            if (unit.id === unitId) {
              const newInherited = !unit.flowInherited;
              return {
                ...unit,
                flowInherited: newInherited,
                inletFlow: newInherited ? l.designFlow : unit.inletFlow,
                outletFlow: newInherited ? l.designFlow : unit.outletFlow
              };
            }
            return unit;
          })
        };
      }
      return l;
    }));
  };

  // 更新單元流量
  const updateUnitFlow = (lineId, unitId, flowType, value) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          units: line.units.map(unit => unit.id === unitId ? { ...unit, [flowType]: Number(value), flowInherited: false } : unit)
        };
      }
      return line;
    }));
  };

  // 新增額外進流（帶類型）
  const addAdditionalInlet = (lineId, unitId, inletType) => {
    const typeConfig = INLET_TYPES[inletType];
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          units: line.units.map(unit => {
            if (unit.id === unitId) {
              const inletIndex = unit.additionalInlets.length + 1;
              const newInlet = {
                id: `inlet-${Date.now()}`,
                type: inletType,
                icon: typeConfig.icon,
                name: inletType === '自訂' ? `自訂進流 ${inletIndex}` : typeConfig.name,
                flowId: `WTB-${inletType === '自訂' ? '自訂' : inletType}${inletIndex}`,
                flow: typeConfig.defaultFlow,
                concentrations: {}
              };
              reportItems.filter(item => item.enabled).forEach(item => {
                newInlet.concentrations[item.name] = 0;
              });
              // 新增的進流放在陣列最前面（往上新增）
              return { ...unit, additionalInlets: [newInlet, ...unit.additionalInlets] };
            }
            return unit;
          })
        };
      }
      return line;
    }));
    setShowInletModal(false);
  };

  // 刪除額外進流
  const removeAdditionalInlet = (lineId, unitId, inletId) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          units: line.units.map(unit => {
            if (unit.id === unitId) {
              return { ...unit, additionalInlets: unit.additionalInlets.filter(i => i.id !== inletId) };
            }
            return unit;
          })
        };
      }
      return line;
    }));
  };

  // 更新額外進流
  const updateAdditionalInlet = (lineId, unitId, inletId, field, value) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          units: line.units.map(unit => {
            if (unit.id === unitId) {
              return {
                ...unit,
                additionalInlets: unit.additionalInlets.map(inlet => {
                  if (inlet.id === inletId) {
                    if (field === 'concentration') {
                      return { ...inlet, concentrations: { ...inlet.concentrations, [value.itemName]: Number(value.conc) } };
                    }
                    return { ...inlet, [field]: field === 'flow' ? Number(value) : value };
                  }
                  return inlet;
                })
              };
            }
            return unit;
          })
        };
      }
      return line;
    }));
  };

  // 更新單元削減率
  const updateUnitRemovalRate = (lineId, unitId, itemName, rate) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          units: line.units.map(unit => {
            if (unit.id === unitId) {
              const inletConc = unit.concentrations[itemName]?.inlet || 0;
              const outletConc = Number((inletConc * (1 - rate / 100)).toFixed(3));
              return {
                ...unit,
                removalRates: { ...unit.removalRates, [itemName]: Number(rate) },
                concentrations: { ...unit.concentrations, [itemName]: { inlet: inletConc, outlet: outletConc, removalRate: Number(rate) } }
              };
            }
            return unit;
          })
        };
      }
      return line;
    }));
  };

  // 更新單元進流濃度
  const updateUnitInletConc = (lineId, unitId, itemName, conc) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          units: line.units.map(unit => {
            if (unit.id === unitId) {
              const removalRate = unit.removalRates[itemName] || 0;
              const outletConc = Number((Number(conc) * (1 - removalRate / 100)).toFixed(3));
              return {
                ...unit,
                concentrations: { ...unit.concentrations, [itemName]: { inlet: Number(conc), outlet: outletConc, removalRate } }
              };
            }
            return unit;
          })
        };
      }
      return line;
    }));
  };

  // 計算質量
  const calculateMass = (flow, concentration) => {
    if (typeof concentration === 'string' || concentration === undefined) return '-';
    return Number((flow * concentration * 0.001).toFixed(3));
  };

  // 計算總進流量
  const calculateTotalInletFlow = (unit) => {
    if (!unit) return 0;
    let total = unit.inletFlow;
    unit.additionalInlets.forEach(inlet => { total += inlet.flow; });
    return total;
  };

  // 計算總進流質量
  const calculateTotalInletMass = (unit, itemName) => {
    if (!unit || !itemName) return 0;
    const item = reportItems.find(i => i.name === itemName);
    if (item?.isRange) return '-';
    const mainMass = calculateMass(unit.inletFlow, unit.concentrations[itemName]?.inlet || 0);
    let additionalMass = 0;
    unit.additionalInlets.forEach(inlet => {
      additionalMass += calculateMass(inlet.flow, inlet.concentrations[itemName] || 0);
    });
    if (mainMass === '-') return '-';
    return Number((mainMass + additionalMass).toFixed(3));
  };

  // 重新計算
  const recalculateLine = (lineId) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        let prevUnit = null;
        const updatedUnits = line.units.map((unit) => {
          const updatedConcentrations = {};
          const totalInletFlow = calculateTotalInletFlow(unit);

          reportItems.filter(item => item.enabled).forEach(item => {
            const mainInletConc = prevUnit ? (prevUnit.concentrations[item.name]?.outlet || item.concentration) : item.concentration;
            let mixedInletConc = mainInletConc;
            if (unit.additionalInlets.length > 0 && !item.isRange && totalInletFlow > 0) {
              let totalMass = unit.inletFlow * mainInletConc;
              unit.additionalInlets.forEach(inlet => { totalMass += inlet.flow * (inlet.concentrations[item.name] || 0); });
              mixedInletConc = totalMass / totalInletFlow;
            }
            const removalRate = unit.removalRates[item.name] || 0;
            const outletConc = item.isRange ? mixedInletConc : Number((mixedInletConc * (1 - removalRate / 100)).toFixed(3));
            updatedConcentrations[item.name] = { inlet: mixedInletConc, outlet: outletConc, removalRate };
          });

          prevUnit = { ...unit, concentrations: updatedConcentrations };
          return { ...unit, concentrations: updatedConcentrations };
        });
        return { ...line, units: updatedUnits };
      }
      return line;
    }));
  };

  const selectedLine = lines.find(l => l.id === selectedLineId);
  const selectedUnit = selectedLine?.units.find(u => u.id === selectedUnitId);

  // DnD 感應器設定
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 單元重新排序
  const reorderUnits = (lineId, oldIndex, newIndex) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        const newUnits = arrayMove(line.units, oldIndex, newIndex);
        // 更新 flowId
        newUnits.forEach((unit, idx) => {
          unit.flowId = `T${idx + 1}`;
        });
        return { ...line, units: newUnits };
      }
      return line;
    }));
  };

  // 拖放結束處理
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id && selectedLineId) {
      const oldIndex = selectedLine.units.findIndex(u => u.id === active.id);
      const newIndex = selectedLine.units.findIndex(u => u.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderUnits(selectedLineId, oldIndex, newIndex);
      }
    }
  };

  // 可拖曳單元卡片元件
  const SortableUnitCard = ({ unit, index, isSelected, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: unit.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : 1,
      opacity: isDragging ? 0.8 : 1,
    };

    return (
      <button
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onClick}
        className={`flex-shrink-0 p-3 rounded-lg border min-w-[80px] cursor-grab active:cursor-grabbing ${isSelected ? 'bg-cyan-500/20 border-cyan-400' : 'bg-slate-700/50 border-slate-600 hover:border-cyan-400/50'
          } ${isDragging ? 'shadow-lg ring-2 ring-cyan-400' : ''}`}
      >
        <div className="text-2xl text-center">{unit.icon}</div>
        <p className="text-xs mt-1 text-center truncate">{unit.name}</p>
        <p className="text-xs text-slate-500">{unit.flowId}</p>
        {unit.additionalInlets.length > 0 && (
          <div className="flex items-center justify-center gap-1 mt-1">
            <Plus className="w-3 h-3 text-orange-400" /><span className="text-xs text-orange-400">{unit.additionalInlets.length}</span>
          </div>
        )}
      </button>
    );
  };

  // 可編輯文字元件
  const EditableText = ({ value, onSave, className = "" }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
            className="bg-slate-900 border border-cyan-400 rounded px-2 py-1 text-white text-sm focus:outline-none w-32"
            autoFocus onKeyPress={(e) => { if (e.key === 'Enter') { onSave(editValue); setIsEditing(false); } }} />
          <button onClick={() => { onSave(editValue); setIsEditing(false); }} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
          <button onClick={() => setIsEditing(false)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <span>{value}</span>
        <button onClick={() => { setEditValue(value); setIsEditing(true); }} className="text-slate-400 hover:text-cyan-400"><Edit2 className="w-3 h-3" /></button>
      </div>
    );
  };

  // 進流類型選擇 Modal
  const InletTypeModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInletModal(false)}>
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-cyan-400">選擇進流類型</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(INLET_TYPES).map(([type, config]) => (
            <button key={type} onClick={() => addAdditionalInlet(selectedLineId, selectedUnitId, type)}
              className="p-4 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-cyan-400/50 text-left transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{config.icon}</span>
                <span className="font-medium">{config.name}</span>
              </div>
              <p className="text-xs text-slate-400">{config.description}</p>
              <p className="text-xs text-cyan-400 mt-1">預設流量: {config.defaultFlow} CMD</p>
            </button>
          ))}
        </div>
        <button onClick={() => setShowInletModal(false)} className="mt-4 w-full py-2 bg-slate-700 rounded-lg text-slate-400 hover:bg-slate-600">取消</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showProjectList && (
                <button onClick={backToProjectList} className="p-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="返回專案列表">
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">污水處理設施計算系統</h1>
                <p className="text-xs text-slate-400">
                  Wastewater Treatment Calculator v3.0
                  {!showProjectList && activeProjectId && <span className="ml-2 text-cyan-400">｜ {facilityName || '未命名專案'}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={clearAllData} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 border border-red-400/50 rounded-lg text-red-400 text-xs hover:bg-red-500/30 transition-all">
                <Trash2 className="w-3 h-3" />清除資料
              </button>
              <div className="text-right text-xs text-slate-400">
                <p>Nick Chang｜ZN Studio</p>
                <p>nickleo051216@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Modal */}
      {showInletModal && <InletTypeModal />}

      {/* 專案列表頁面 */}
      {showProjectList ? (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">專案管理</h2>
            <p className="text-slate-400">選擇一個專案繼續編輯，或建立新專案</p>
          </div>

          {/* 新增專案表單 */}
          {showNewProjectForm ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-cyan-500/50 p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-cyan-400">建立新專案</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="輸入專案/設施名稱（例：○○公司廢水處理設施）"
                  className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && createNewProject()}
                />
                <button onClick={createNewProject} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-medium hover:opacity-90 transition-all">
                  建立
                </button>
                <button onClick={() => { setShowNewProjectForm(false); setNewProjectName(''); }} className="px-6 py-3 bg-slate-700 rounded-lg font-medium hover:bg-slate-600 transition-all">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewProjectForm(true)} className="w-full mb-6 p-6 bg-slate-800/30 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-600 hover:border-cyan-400/50 text-slate-400 hover:text-cyan-400 transition-all flex items-center justify-center gap-3">
              <Plus className="w-6 h-6" />
              <span className="text-lg font-medium">建立新專案</span>
            </button>
          )}

          {/* 專案列表 */}
          {projects.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-slate-500 text-lg">尚未建立任何專案</p>
              <p className="text-slate-600 text-sm mt-2">點擊上方按鈕建立您的第一個專案</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => loadProject(project.id)}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 cursor-pointer hover:border-cyan-400/50 hover:bg-slate-800/70 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {project.name || '未命名專案'}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        {project.businessType && (
                          <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">{project.businessType}</span>
                        )}
                        <span>建立於 {new Date(project.createdAt).toLocaleDateString('zh-TW')}</span>
                        <span>更新於 {new Date(project.updatedAt).toLocaleDateString('zh-TW')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => deleteProject(project.id, e)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="刪除專案"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center text-xs text-slate-500">
            共 {projects.length} 個專案
          </div>
        </div>
      ) : (
        /* 專案編輯頁面（原有內容） */
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[{ step: 1, label: '設施資訊', icon: Building2 }, { step: 2, label: '申報項目', icon: FileText }, { step: 3, label: '處理流程', icon: Calculator }, { step: 4, label: '水量平衡圖', icon: Activity }].map((item, index) => (
              <React.Fragment key={item.step}>
                <button onClick={() => setCurrentStep(item.step)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${currentStep === item.step ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400' : currentStep > item.step ? 'bg-green-500/20 border border-green-400/50 text-green-400' : 'bg-slate-800/50 border border-slate-600/50 text-slate-400'}`}>
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {currentStep > item.step && <Check className="w-4 h-4" />}
                </button>
                {index < 3 && <ArrowRight className={`w-4 h-4 ${currentStep > item.step ? 'text-green-400' : 'text-slate-600'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2"><Building2 className="w-5 h-5 text-cyan-400" />設施基本資料</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">設施名稱</label>
                  <input type="text" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="例：○○公司廢水處理設施"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">設計處理量 (CMD)</label>
                  <input type="number" value={designFlow} onChange={(e) => setDesignFlow(Number(e.target.value))}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-2">事業類別</label>
                  <select value={businessType} onChange={(e) => handleBusinessTypeChange(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-400">
                    <option value="">請選擇事業類別...</option>
                    {Object.keys(BUSINESS_TYPES).map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>
              {businessType && (
                <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
                  <p className="text-sm text-cyan-400">✓ 已選擇「{businessType}」，系統將自動帶入對應的申報項目</p>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button onClick={() => setCurrentStep(2)} disabled={!businessType}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-medium hover:opacity-90 disabled:opacity-50">
                  下一步<ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 - 申報項目（可新增） */}
          {currentStep === 2 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" />申報項目管理</h2>
                <button onClick={() => setShowAddItem(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 text-sm hover:bg-cyan-500/30">
                  <Plus className="w-4 h-4" />新增項目
                </button>
              </div>

              {showAddItem && (
                <div className="mb-6 p-4 bg-slate-900/50 border border-cyan-400/30 rounded-lg">
                  <h4 className="text-sm font-medium text-cyan-400 mb-3">新增自訂項目</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">項目名稱</label>
                      <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="例：總有機碳"
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">單位</label>
                      <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400">
                        <option value="mg/L">mg/L</option>
                        <option value="μg/L">μg/L</option>
                        <option value="CFU/100mL">CFU/100mL</option>
                        <option value="ADMI">ADMI</option>
                        <option value="-">-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">預設濃度</label>
                      <input type="number" value={newItemConc} onChange={(e) => setNewItemConc(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400" />
                    </div>
                    <div className="flex items-end gap-2">
                      <button onClick={addCustomItem} className="px-4 py-2 bg-cyan-500 rounded text-white text-sm hover:bg-cyan-600">新增</button>
                      <button onClick={() => setShowAddItem(false)} className="px-4 py-2 bg-slate-700 rounded text-white text-sm hover:bg-slate-600">取消</button>
                    </div>
                  </div>
                </div>
              )}

              {['一般水質', '特定水質(一)', '特定水質(二)', '自訂項目'].map(category => {
                const categoryItems = reportItems.filter(item => item.category === category);
                if (categoryItems.length === 0) return null;
                return (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${category === '一般水質' ? 'bg-blue-400' : category === '特定水質(一)' ? 'bg-orange-400' : category === '特定水質(二)' ? 'bg-purple-400' : 'bg-green-400'}`} />
                      {category} ({categoryItems.length} 項)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-700">
                            <th className="text-left py-2 px-3 w-10">啟用</th>
                            <th className="text-left py-2 px-3">項目名稱</th>
                            <th className="text-left py-2 px-3">預設濃度</th>
                            <th className="text-left py-2 px-3">單位</th>
                            <th className="text-left py-2 px-3 w-10">刪除</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryItems.map(item => (
                            <tr key={item.id} className={`border-b border-slate-700/50 ${!item.enabled ? 'opacity-50' : ''}`}>
                              <td className="py-2 px-3">
                                <button onClick={() => setReportItems(reportItems.map(i => i.id === item.id ? { ...i, enabled: !i.enabled } : i))}
                                  className={`w-6 h-6 rounded flex items-center justify-center ${item.enabled ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                                  {item.enabled && <Check className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="py-2 px-3 font-medium">{item.name}</td>
                              <td className="py-2 px-3">
                                {item.isRange ? <span className="text-slate-400">{item.concentration}</span> : (
                                  <input type="number" value={item.concentration}
                                    onChange={(e) => setReportItems(reportItems.map(i => i.id === item.id ? { ...i, concentration: Number(e.target.value) } : i))}
                                    className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none focus:border-cyan-400" />
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{item.unit}</td>
                              <td className="py-2 px-3">
                                {item.category === '自訂項目' && (
                                  <button onClick={() => setReportItems(reportItems.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              <div className="mt-6 flex justify-between">
                <button onClick={() => setCurrentStep(1)} className="px-6 py-3 bg-slate-700 rounded-lg font-medium hover:bg-slate-600">上一步</button>
                <button onClick={() => setCurrentStep(3)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-medium hover:opacity-90">
                  下一步<ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左側：處理線列表 */}
              <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2"><Droplets className="w-4 h-4 text-cyan-400" />處理線</h3>
                  <button onClick={addLine} className="p-2 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 hover:bg-cyan-500/30"><Plus className="w-4 h-4" /></button>
                </div>

                {lines.length === 0 ? (
                  <div className="text-center py-8 text-slate-500"><p className="text-sm">尚未建立處理線</p></div>
                ) : (
                  <div className="space-y-2">
                    {lines.map(line => (
                      <div key={line.id} onClick={() => { setSelectedLineId(line.id); setSelectedUnitId(null); }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${selectedLineId === line.id ? 'bg-cyan-500/20 border border-cyan-400/50' : 'bg-slate-700/50 border border-transparent hover:bg-slate-700'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <EditableText value={line.name} onSave={(newName) => updateLineName(line.id, newName)} className="font-medium text-sm" />
                          <button onClick={(e) => { e.stopPropagation(); removeLine(line.id); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">流量:</span>
                          <input type="number" value={line.designFlow} onChange={(e) => { e.stopPropagation(); updateLineFlow(line.id, e.target.value); }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400" />
                          <span className="text-xs text-slate-500">CMD</span>
                        </div>
                        {line.units.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 overflow-x-auto">
                            {line.units.map((unit, index) => (
                              <React.Fragment key={unit.id}>
                                <span className="text-lg" title={unit.name}>{unit.icon}</span>
                                {index < line.units.length - 1 && <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedLineId && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <h4 className="text-sm text-slate-400 mb-2">新增處理單元</h4>
                    <select
                      onChange={(e) => { if (e.target.value) { addUnit(selectedLineId, e.target.value); e.target.value = ''; } }}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                      defaultValue=""
                    >
                      <option value="" disabled>選擇單元類型...</option>
                      {Object.entries(UNIT_TYPES).map(([type, config]) => (
                        <option key={type} value={type}>{config.icon} {type}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 右側 */}
              <div className="lg:col-span-2 space-y-4">
                {selectedLine && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{selectedLine.name} - 單元配置</h3>
                      <button onClick={() => recalculateLine(selectedLineId)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/50 rounded-lg text-cyan-400 text-sm hover:bg-cyan-500/30">
                        <RotateCcw className="w-4 h-4" />重新計算
                      </button>
                    </div>
                    {selectedLine.units.length === 0 ? (
                      <div className="text-center py-8 text-slate-500"><p className="text-sm">尚未建立處理單元</p></div>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={selectedLine.units.map(u => u.id)} strategy={horizontalListSortingStrategy}>
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            <p className="text-xs text-slate-500 mr-2">拖曳調整順序 →</p>
                            {selectedLine.units.map((unit, index) => (
                              <React.Fragment key={unit.id}>
                                <SortableUnitCard
                                  unit={unit}
                                  index={index}
                                  isSelected={selectedUnitId === unit.id}
                                  onClick={() => setSelectedUnitId(unit.id)}
                                />
                                {index < selectedLine.units.length - 1 && <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                              </React.Fragment>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                )}

                {selectedUnit && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedUnit.icon}</span>
                        <EditableText value={selectedUnit.name} onSave={(newName) => updateUnitName(selectedLineId, selectedUnit.id, newName)} className="font-semibold" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowInletModal(true)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 border border-orange-400/50 rounded-lg text-orange-400 text-sm hover:bg-orange-500/30">
                          <Plus className="w-4 h-4" />新增進流
                        </button>
                        <button onClick={() => removeUnit(selectedLineId, selectedUnitId)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* 流量設定 */}
                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-900/50 rounded-lg">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-slate-400">主進流量 (CMD)</label>
                          <button onClick={() => toggleFlowInheritance(selectedLineId, selectedUnitId)}
                            className={`text-xs flex items-center gap-1 ${selectedUnit.flowInherited ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {selectedUnit.flowInherited ? <Link className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                            {selectedUnit.flowInherited ? '已繼承' : '獨立'}
                          </button>
                        </div>
                        <input type="number" value={selectedUnit.inletFlow} onChange={(e) => updateUnitFlow(selectedLineId, selectedUnitId, 'inletFlow', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">出流量 (CMD)</label>
                        <input type="number" value={selectedUnit.outletFlow} onChange={(e) => updateUnitFlow(selectedLineId, selectedUnitId, 'outletFlow', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-400" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">總進流量</label>
                        <div className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-cyan-400 font-medium">{calculateTotalInletFlow(selectedUnit)} CMD</div>
                      </div>
                    </div>

                    {/* ==================== 進流與出流並排布局 ==================== */}
                    <div className="flex gap-4">
                      {/* 左側：所有進流（新增的在上方） */}
                      <div className="flex-1 min-w-0 space-y-4">
                        {/* 額外進流（新增的在最上面） */}
                        {selectedUnit.additionalInlets.map((inlet, inletIndex) => (
                          <div key={inlet.id} className="border border-orange-500/30 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-2 bg-orange-500/10">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{inlet.icon}</span>
                                <EditableText value={inlet.name} onSave={(newName) => updateAdditionalInlet(selectedLineId, selectedUnitId, inlet.id, 'name', newName)} className="text-sm text-orange-400 font-medium" />
                              </div>
                              <button onClick={() => removeAdditionalInlet(selectedLineId, selectedUnitId, inlet.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="p-2 bg-orange-500/5">
                              <div className="flex items-center gap-2 mb-2">
                                <EditableText value={inlet.flowId} onSave={(newId) => updateAdditionalInlet(selectedLineId, selectedUnitId, inlet.id, 'flowId', newId)} className="text-xs text-orange-400" />
                                <span className="text-xs text-slate-400">流量:</span>
                                <input type="number" value={inlet.flow} onChange={(e) => updateAdditionalInlet(selectedLineId, selectedUnitId, inlet.id, 'flow', e.target.value)}
                                  className="w-20 bg-slate-800 border border-orange-500/50 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-orange-400" />
                                <span className="text-xs text-slate-400">CMD</span>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-400">
                                    <th className="text-left py-1 px-2">水質項目</th>
                                    <th className="text-center py-1 px-2">濃度</th>
                                    <th className="text-center py-1 px-2">質量</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reportItems.filter(item => item.enabled).map(item => {
                                    const conc = inlet.concentrations[item.name] || 0;
                                    return (
                                      <tr key={item.id} className="border-t border-slate-700/50">
                                        <td className="py-1 px-2">{item.name}<span className="text-slate-500 ml-1">({item.unit})</span></td>
                                        <td className="py-1 px-2 text-center">
                                          {item.isRange ? '-' : (
                                            <input type="number" value={conc}
                                              onChange={(e) => updateAdditionalInlet(selectedLineId, selectedUnitId, inlet.id, 'concentration', { itemName: item.name, conc: e.target.value })}
                                              className="w-16 bg-slate-800 border border-orange-500/50 rounded px-1 py-0.5 text-center text-white text-xs focus:outline-none focus:border-orange-400" />
                                          )}
                                        </td>
                                        <td className="py-1 px-2 text-center text-orange-400">{item.isRange ? '-' : calculateMass(inlet.flow, conc)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}

                        {/* 主進流（永遠在最下面） */}
                        <div className="border border-blue-500/30 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-2 bg-blue-500/10">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📥</span>
                              <span className="text-sm text-blue-400 font-medium">主進流</span>
                            </div>
                          </div>
                          <div className="p-2 bg-blue-500/5">
                            <div className="flex items-center gap-2 mb-2">
                              <EditableText value={selectedUnit.inletFlowId} onSave={(newId) => updateFlowId(selectedLineId, selectedUnit.id, 'inletFlowId', newId)} className="text-xs text-blue-400" />
                              <span className="text-xs text-slate-400">流量: {selectedUnit.inletFlow} CMD</span>
                            </div>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-400">
                                  <th className="text-left py-1 px-2">水質項目</th>
                                  <th className="text-center py-1 px-2">濃度</th>
                                  <th className="text-center py-1 px-2">質量</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportItems.filter(item => item.enabled).map(item => {
                                  const conc = selectedUnit.concentrations[item.name] || { inlet: 0 };
                                  return (
                                    <tr key={item.id} className="border-t border-slate-700/50">
                                      <td className="py-1 px-2">{item.name}<span className="text-slate-500 ml-1">({item.unit})</span></td>
                                      <td className="py-1 px-2 text-center">
                                        {item.isRange ? <span>{conc.inlet}</span> : (
                                          <input type="number" value={conc.inlet} onChange={(e) => updateUnitInletConc(selectedLineId, selectedUnitId, item.name, e.target.value)}
                                            className="w-16 bg-slate-800 border border-blue-500/50 rounded px-1 py-0.5 text-center text-white text-xs focus:outline-none focus:border-blue-400" />
                                        )}
                                      </td>
                                      <td className="py-1 px-2 text-center text-blue-400">{calculateMass(selectedUnit.inletFlow, conc.inlet)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* 右側：出流（維持 v2.0 EMS 格式） */}
                      <div className="flex-1 min-w-0 border border-green-500/30 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-2 bg-green-500/10">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">📤</span>
                            <span className="text-sm text-green-400 font-medium">出流</span>
                            <EditableText value={selectedUnit.outletFlowId} onSave={(newId) => updateFlowId(selectedLineId, selectedUnit.id, 'outletFlowId', newId)} className="text-xs text-green-400" />
                          </div>
                        </div>
                        <div className="p-2 bg-green-500/5">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-400">
                                <th className="text-left py-1 px-2" rowSpan={2}>水質項目</th>
                                <th className="text-center py-1 px-2 border-l border-slate-700" colSpan={2}>進流（混合後）</th>
                                <th className="text-center py-1 px-2">削減</th>
                                <th className="text-center py-1 px-2 border-l border-slate-700" colSpan={2}>出流</th>
                              </tr>
                              <tr className="text-slate-500 text-xs">
                                <th className="py-1 px-1 border-l border-slate-700">濃度</th>
                                <th className="py-1 px-1">質量</th>
                                <th className="py-1 px-1">(%)</th>
                                <th className="py-1 px-1 border-l border-slate-700">濃度</th>
                                <th className="py-1 px-1">質量</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportItems.filter(item => item.enabled).map(item => {
                                const conc = selectedUnit.concentrations[item.name] || { inlet: 0, outlet: 0, removalRate: 0 };
                                const totalInletMass = calculateTotalInletMass(selectedUnit, item.name);
                                return (
                                  <tr key={item.id} className="border-t border-slate-700/50">
                                    <td className="py-1 px-2">{item.name}<span className="text-slate-500 ml-1">({item.unit})</span></td>
                                    <td className="py-1 px-1 text-center border-l border-slate-700 text-cyan-400">{item.isRange ? conc.inlet : (conc.inlet || 0).toFixed(2)}</td>
                                    <td className="py-1 px-1 text-center text-cyan-400">{totalInletMass}</td>
                                    <td className="py-1 px-1 text-center">
                                      {item.isRange || item.name === 'pH' || item.name === '水溫' ? <span className="text-slate-500">-</span> : (
                                        <input type="number" value={conc.removalRate} onChange={(e) => updateUnitRemovalRate(selectedLineId, selectedUnitId, item.name, e.target.value)}
                                          className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-center text-white text-xs focus:outline-none focus:border-cyan-400" min="0" max="100" />
                                      )}
                                    </td>
                                    <td className="py-1 px-1 text-center border-l border-slate-700 text-green-400">{item.isRange ? conc.outlet : (conc.outlet || 0).toFixed(2)}</td>
                                    <td className="py-1 px-1 text-center text-green-400">{item.isRange ? '-' : calculateMass(calculateTotalInletFlow(selectedUnit), conc.outlet)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
                      <p>📝 <strong>v2.4 布局：</strong>進流在左側（新增的往上疊加）｜ 出流在右側並排 ｜ 進流類型：🔄RAS 🧪化學藥劑 💧上清液 🔀其他處理線 📝自訂</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={() => setCurrentStep(2)} className="px-6 py-3 bg-slate-700 rounded-lg font-medium hover:bg-slate-600">上一步</button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium hover:opacity-90"
                    onClick={() => alert('匯出功能將在下一階段實作！')}>
                    <Download className="w-4 h-4" />匯出報表
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - 水量平衡圖 (原本遺漏的部分) */}
          {currentStep === 4 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />水量平衡圖 (Sankey Diagram)
                </h2>
              </div>

              {lines.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                  <p className="text-slate-500 mb-2">尚未建立任何處理線</p>
                  <button onClick={() => setCurrentStep(3)} className="text-cyan-400 hover:text-cyan-300 underline">
                    前往建立處理流程
                  </button>
                </div>
              ) : (
                <div>
                  {/* 圖表類型切換 */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setDiagramType('reactflow')}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${diagramType === 'reactflow'
                        ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400'
                        : 'bg-slate-700 border border-slate-600 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                      🖱️ 可拖曳流程圖
                    </button>
                    <button
                      onClick={() => setDiagramType('pfd')}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${diagramType === 'pfd'
                        ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400'
                        : 'bg-slate-700 border border-slate-600 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                      📐 靜態流程圖
                    </button>
                  </div>

                  {/* 根據選擇顯示對應圖表 */}
                  {diagramType === 'reactflow' && <ReactFlowDiagram lines={lines} />}
                  {diagramType === 'pfd' && <ProcessFlowDiagram lines={lines} />}
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button onClick={() => setCurrentStep(3)} className="px-6 py-3 bg-slate-700 rounded-lg font-medium hover:bg-slate-600">
                  上一步
                </button>
                <div className="flex gap-2">
                  {/* 預留匯出按鈕位置 */}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="mt-12 py-6 border-t border-slate-700/50 text-center text-slate-500 text-sm">
        <p>Nick Chang｜ZN Studio</p>
        <p className="mt-1">
          <a href="mailto:nickleo051216@gmail.com" className="hover:text-cyan-400">nickleo051216@gmail.com</a> ｜
          <a href="tel:0932-684-051" className="hover:text-cyan-400">0932-684-051</a>
        </p>
        <p className="mt-1">
          <a href="https://portaly.cc/zn.studio" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">ZN Studio</a> ｜
          <a href="https://www.threads.com/@nickai216" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Threads @nickai216</a> ｜
          <a href="https://reurl.cc/1OZNAY" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Line 社群</a>
        </p>
      </footer>
    </div>
  );
}
