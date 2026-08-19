import React, { useState, useEffect, useMemo } from 'react';
import { 
  Militar, 
  Destino, 
  EscalaAssignment, 
  EscalaTipo, 
  EscalaMeta,
  UserSession, 
  AppPage,
  Organization,
  UserAccount,
  Missao,
  AgendaItem
} from './types';
import { 
  INITIAL_MILITARES, 
  INITIAL_DESTINOS, 
  INITIAL_ASSIGNMENTS,
  ESCALA_METAS
} from './data/initialMilitaryData';
import {
  subscribeMilitares,
  saveMilitarToFirestore,
  deleteMilitarFromFirestore,
  deleteAllMilitaresFromFirestore,
  saveMilitaresList,
  subscribeAssignments,
  updateAssignmentsBatchInFirestore,
  saveAssignmentsList,
  subscribeDestinos,
  saveDestinoToFirestore,
  deleteDestinoFromFirestore,
  saveDestinosList,
  subscribeEscalasMeta,
  saveEscalaMetaToFirestore,
  deleteEscalaMetaFromFirestore,
  saveEscalasMetaMap,
  subscribeRedDays,
  saveRedDaysToFirestore,
  subscribeOrganizations,
  saveOrganizationsList,
  saveOrganizationToFirestore,
  deleteOrganizationFromFirestore,
  subscribeUsers,
  saveUsersList,
  saveUserToFirestore,
  deleteUserFromFirestore,
  subscribeMissoes,
  saveMissao,
  updateMissaoStatus,
  deleteMissao,
  subscribeAgenda,
  saveAgendaItem,
  deleteAgendaItem,
  INITIAL_ORGANIZATIONS,
  INITIAL_USERS
} from './lib/firebase';

import { JarvisSplashScreen } from './components/JarvisSplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { NightOpsLayout } from './components/NightOpsLayout';
import { OfflineBanner } from './components/OfflineBanner';
import { VisaoGeralView } from './components/VisaoGeralView';
import { MainMenuScreen } from './components/MainMenuScreen';
import { EscalasSelectionPage } from './components/EscalasSelectionPage';
import { EscalasView } from './components/EscalasView';
import { MapaForcaView } from './components/MapaForcaView';
import { AditamentoView } from './components/AditamentoView';
import { DestinosView } from './components/DestinosView';
import { MissoesView } from './components/MissoesView';
import { AgendaView } from './components/AgendaView';
import { PernoiteView } from './components/PernoiteView';
import { GestaoView } from './components/GestaoView';
import { initPushNotifications } from './services/notificationService';

export default function App() {
  // App Navigation Flow: 'splash' -> 'login' -> 'authenticated'
  const [appState, setAppState] = useState<'splash' | 'login' | 'authenticated'>('splash');
  const [session, setSession] = useState<UserSession | null>(null);
  
  // Multi-tenancy State
  const [organizations, setOrganizations] = useState<Organization[]>(INITIAL_ORGANIZATIONS);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [activeOrgId, setActiveOrgId] = useState<string>('rancho');

  // Page State after authentication: defaults to 'visao_geral'
  const [currentPage, setCurrentPage] = useState<AppPage>('visao_geral');
  const [activeEscala, setActiveEscala] = useState<EscalaTipo>('permanencia');

  // Core Data State (per organization)
  const [militares, setMilitares] = useState<Militar[]>(INITIAL_MILITARES);
  const [destinos, setDestinos] = useState<Destino[]>(INITIAL_DESTINOS);
  const [assignments, setAssignments] = useState<EscalaAssignment[]>(INITIAL_ASSIGNMENTS);
  const [escalasMeta, setEscalasMeta] = useState<Record<string, EscalaMeta>>(ESCALA_METAS);
  const [customRedDays, setCustomRedDays] = useState<Record<string, boolean>>({});

  // New Night Ops Modules State (per organization)
  const [missoes, setMissoes] = useState<Missao[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  // Initialize PWA Push & Service Worker in background
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SGE PWA] Service Worker active:', reg.scope);
        })
        .catch((err) => {
          console.log('[SGE PWA] SW registration notice:', err);
        });
    }
  }, []);

  // Subscribe to Organizations & Users
  useEffect(() => {
    const unsubOrgs = subscribeOrganizations((data) => setOrganizations(data));
    const unsubUsers = subscribeUsers((data) => setUsers(data));

    return () => {
      unsubOrgs();
      unsubUsers();
    };
  }, []);

  // Update activeOrgId when session changes
  useEffect(() => {
    if (session?.orgId) {
      setActiveOrgId(session.orgId);
    }
  }, [session]);

  // Subscribe to Firestore / RTDB for real-time state synchronization per Organization
  useEffect(() => {
    const orgToUse = activeOrgId || 'rancho';
    const isDefaultRancho = orgToUse === 'rancho';

    const defaultMil = isDefaultRancho ? INITIAL_MILITARES : [];
    const defaultDst = isDefaultRancho ? INITIAL_DESTINOS : [];
    const defaultAsg = isDefaultRancho ? INITIAL_ASSIGNMENTS : [];
    const defaultMeta = isDefaultRancho ? ESCALA_METAS : {};

    const unsubMil = subscribeMilitares((data) => setMilitares(data), defaultMil, orgToUse);
    const unsubAsg = subscribeAssignments((data) => setAssignments(data), defaultAsg, orgToUse);
    const unsubDst = subscribeDestinos((data) => setDestinos(data), defaultDst, orgToUse);
    const unsubMeta = subscribeEscalasMeta((data) => setEscalasMeta(data), defaultMeta, orgToUse);
    const unsubRed = subscribeRedDays((data) => setCustomRedDays(data), orgToUse);
    const unsubMissoes = subscribeMissoes(orgToUse, (data) => setMissoes(data));
    const unsubAgenda = subscribeAgenda(orgToUse, (data) => setAgenda(data));

    return () => {
      unsubMil();
      unsubAsg();
      unsubDst();
      unsubMeta();
      unsubRed();
      unsubMissoes();
      unsubAgenda();
    };
  }, [activeOrgId]);

  const currentOrg = organizations.find((o) => o.id === activeOrgId) || {
    id: activeOrgId,
    nome: activeOrgId.toUpperCase(),
    sigla: activeOrgId.toUpperCase(),
    createdAt: '2026-08-01',
    enabledModules: ['escala_select', 'mapa_forca', 'aditamento', 'destinos', 'gestao']
  };

  // Badge counters for side navigation
  const badgeCounts = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const missoesAtrasadas = missoes.filter((m) => {
      if (m.status === 'concluida') return false;
      if (!m.prazoData) return false;
      const timeStr = m.prazoHora || '23:59';
      const deadline = new Date(`${m.prazoData}T${timeStr}:00`);
      return now > deadline;
    }).length;

    const missoesPendentes = missoes.filter(
      (m) => m.status === 'pendente' || m.status === 'em_andamento'
    ).length;

    const agendaHoje = agenda.filter((a) => a.data === todayStr).length;

    return {
      missoesAtrasadas,
      missoesPendentes,
      agendaHoje
    };
  }, [missoes, agenda]);

  const handleUpdateOrgModules = (updatedOrg: Organization) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o))
    );
    saveOrganizationToFirestore(updatedOrg);
  };

  const handleToggleRedDay = (dateStr: string) => {
    setCustomRedDays((prev) => {
      const dateObj = new Date(dateStr + 'T12:00:00');
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const currentIsRed = prev[dateStr] !== undefined ? prev[dateStr] : isWeekend;
      const updated = {
        ...prev,
        [dateStr]: !currentIsRed
      };
      void saveRedDaysToFirestore(updated, activeOrgId);
      return updated;
    });
  };

  // Dynamic Scale Management
  const handleAddScale = (newScale: EscalaMeta) => {
    setEscalasMeta((prev) => ({
      ...prev,
      [newScale.id]: newScale
    }));
    saveEscalaMetaToFirestore(newScale, activeOrgId);
  };

  const handleDeleteScale = (scaleId: string) => {
    setEscalasMeta((prev) => {
      const updated = { ...prev };
      delete updated[scaleId];
      return updated;
    });
    deleteEscalaMetaFromFirestore(scaleId, activeOrgId);

    const toRemove = assignments.filter((a) => a.escalaTipo === scaleId).map((a) => a.id);
    setAssignments((prev) => prev.filter((a) => a.escalaTipo !== scaleId));
    if (toRemove.length > 0) {
      updateAssignmentsBatchInFirestore([], toRemove, activeOrgId);
    }

    const firstRemaining = Object.keys(escalasMeta).find((k) => k !== scaleId) || 'plantao';
    if (activeEscala === scaleId) {
      setActiveEscala(firstRemaining);
    }
  };

  // Handlers for App Navigation Flow
  const handleSplashComplete = () => {
    setAppState('login');
  };

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setActiveOrgId(userSession.orgId);
    setAppState('authenticated');
    setCurrentPage('visao_geral');

    // Register push subscription if permitted
    initPushNotifications(userSession.id, userSession.nomeGuerra, userSession.orgId).catch(() => {});
  };

  const handleLogout = () => {
    setSession(null);
    setAppState('login');
    setCurrentPage('visao_geral');
  };

  const handleReplayAbertura = () => {
    setAppState('splash');
  };

  // Handlers for Military Personnel
  const handleAddMilitar = (newMilitarData: Omit<Militar, 'id'>) => {
    const newMilitar: Militar = {
      ...newMilitarData,
      id: `mil-${Date.now()}`
    };
    setMilitares((prev) => [...prev, newMilitar]);
    saveMilitarToFirestore(newMilitar, activeOrgId);
  };

  const handleUpdateMilitar = (updatedMilitar: Militar) => {
    setMilitares((prev) =>
      prev.map((m) => (m.id === updatedMilitar.id ? updatedMilitar : m))
    );
    saveMilitarToFirestore(updatedMilitar, activeOrgId);
  };

  const handleDeleteMilitar = (militarId: string) => {
    setMilitares((prev) => prev.filter((m) => m.id !== militarId));
    deleteMilitarFromFirestore(militarId, activeOrgId);

    const removeAssignments = assignments.filter((a) => a.militarId === militarId).map((a) => a.id);
    setAssignments((prev) => prev.filter((a) => a.militarId !== militarId));
    if (removeAssignments.length > 0) {
      updateAssignmentsBatchInFirestore([], removeAssignments, activeOrgId);
    }

    const removeDestinos = destinos.filter((d) => d.militarId === militarId);
    setDestinos((prev) => prev.filter((d) => d.militarId !== militarId));
    removeDestinos.forEach((d) => deleteDestinoFromFirestore(d.id, activeOrgId));
  };

  const handleDeleteAllMilitares = () => {
    const ids = militares.map((m) => m.id);
    setMilitares([]);
    deleteAllMilitaresFromFirestore(ids, activeOrgId);

    const allAssignmentIds = assignments.map((a) => a.id);
    setAssignments([]);
    if (allAssignmentIds.length > 0) {
      updateAssignmentsBatchInFirestore([], allAssignmentIds, activeOrgId);
    }

    const allDestinos = [...destinos];
    setDestinos([]);
    allDestinos.forEach((d) => deleteDestinoFromFirestore(d.id, activeOrgId));
  };

  const handleReorderMilitares = (reordered: Militar[]) => {
    setMilitares(reordered);
    saveMilitaresList(reordered, activeOrgId);
  };

  // Handlers for Destinations
  const handleAddDestino = (newDestinoData: Omit<Destino, 'id'>) => {
    const newDestino: Destino = {
      ...newDestinoData,
      id: `dest-${Date.now()}`
    };
    setDestinos((prev) => [newDestino, ...prev]);
    saveDestinoToFirestore(newDestino, activeOrgId);

    // Remove any scale assignments for this military during these blocked dates
    const removeAssignments = assignments.filter((a) => {
      if (a.militarId !== newDestinoData.militarId) return false;
      return a.data >= newDestinoData.dataInicio && a.data <= newDestinoData.dataFim;
    }).map((a) => a.id);

    setAssignments((prev) =>
      prev.filter((a) => {
        if (a.militarId !== newDestinoData.militarId) return true;
        return !(a.data >= newDestinoData.dataInicio && a.data <= newDestinoData.dataFim);
      })
    );

    if (removeAssignments.length > 0) {
      updateAssignmentsBatchInFirestore([], removeAssignments, activeOrgId);
    }
  };

  const handleDeleteDestino = (destinoId: string) => {
    setDestinos((prev) => prev.filter((d) => d.id !== destinoId));
    deleteDestinoFromFirestore(destinoId, activeOrgId);
  };

  // Handlers for Scale Assignments
  const handleToggleAssignment = (
    militarId: string,
    escalaTipo: EscalaTipo,
    dateStr: string,
    targetFuncaoSigla?: string
  ) => {
    const isBlocked = destinos.some(
      (d) =>
        d.militarId === militarId &&
        d.bloqueiaEscala &&
        dateStr >= d.dataInicio &&
        dateStr <= d.dataFim
    );

    if (isBlocked) {
      alert('ATENÇÃO MILITAR BLOQUEADO: Este militar possui um DESTINO (Férias/Baixa/Licença) registrado nesta data!');
      return;
    }

    let toAddOrUpdate: EscalaAssignment[] = [];
    let toRemoveIds: string[] = [];

    setAssignments((prev) => {
      const existing = prev.filter(
        (a) =>
          a.militarId === militarId &&
          a.escalaTipo === escalaTipo &&
          a.data === dateStr
      );

      if (targetFuncaoSigla) {
        const hasTarget = existing.some((a) => a.funcaoSigla === targetFuncaoSigla);
        if (hasTarget) {
          toRemoveIds = existing.filter((a) => a.funcaoSigla === targetFuncaoSigla).map((a) => a.id);
          return prev.filter(
            (a) =>
              !(
                a.militarId === militarId &&
                a.escalaTipo === escalaTipo &&
                a.data === dateStr &&
                a.funcaoSigla === targetFuncaoSigla
              )
          );
        } else {
          const newAsg: EscalaAssignment = {
            id: `asg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            militarId,
            escalaTipo,
            data: dateStr,
            funcaoSigla: targetFuncaoSigla
          };
          toAddOrUpdate = [newAsg];
          return [...prev, newAsg];
        }
      }

      if (escalaTipo === 'padeiro') {
        const hasDiurno = existing.some((a) => a.funcaoSigla === 'PD' || a.funcaoSigla === 'PAD-D');
        const hasNoturno = existing.some((a) => a.funcaoSigla === 'PN' || a.funcaoSigla === 'PAD-N');
        const hasBothCombined = existing.some((a) => a.funcaoSigla === 'PD+PN' || a.funcaoSigla === 'PAD-D+PAD-N');
        const stableId = existing[0]?.id || `asg-${militarId}-${escalaTipo}-${dateStr}`;

        const cleanPrev = prev.filter(
          (a) => !(a.militarId === militarId && a.escalaTipo === 'padeiro' && a.data === dateStr)
        );

        if (existing.length === 0) {
          const newAsg: EscalaAssignment = {
            id: stableId,
            militarId,
            escalaTipo: 'padeiro',
            data: dateStr,
            funcaoSigla: 'PD'
          };
          toAddOrUpdate = [newAsg];
          return [...cleanPrev, newAsg];
        } else if (hasDiurno && !hasNoturno && !hasBothCombined) {
          const newAsg: EscalaAssignment = {
            id: stableId,
            militarId,
            escalaTipo: 'padeiro',
            data: dateStr,
            funcaoSigla: 'PN'
          };
          toAddOrUpdate = [newAsg];
          return [...cleanPrev, newAsg];
        } else if (!hasDiurno && hasNoturno && !hasBothCombined) {
          const newAsg: EscalaAssignment = {
            id: stableId,
            militarId,
            escalaTipo: 'padeiro',
            data: dateStr,
            funcaoSigla: 'PD+PN'
          };
          toAddOrUpdate = [newAsg];
          return [...cleanPrev, newAsg];
        } else {
          toRemoveIds = existing.map((a) => a.id);
          return cleanPrev;
        }
      }

      const scaleMeta = escalasMeta[escalaTipo];
      const funcoes = scaleMeta?.funcoes || [];
      const stableId = existing[0]?.id || `asg-${militarId}-${escalaTipo}-${dateStr}`;

      const cleanPrev = prev.filter(
        (a) => !(a.militarId === militarId && a.escalaTipo === escalaTipo && a.data === dateStr)
      );

      if (existing.length === 0) {
        const prefSigla = scaleMeta?.militarFuncaoPreferencia?.[militarId];
        const firstSigla = prefSigla || (funcoes.length > 0 ? funcoes[0].sigla : scaleMeta?.sigla || 'P');
        const firstId = funcoes.find((f) => f.sigla === firstSigla)?.id || (funcoes.length > 0 ? funcoes[0].id : undefined);
        const newAsg: EscalaAssignment = {
          id: stableId,
          militarId,
          escalaTipo,
          data: dateStr,
          funcaoSigla: firstSigla,
          funcaoId: firstId
        };
        toAddOrUpdate = [newAsg];
        return [...cleanPrev, newAsg];
      }

      const rawSigla = existing[0].funcaoSigla;
      let normSigla = rawSigla;
      if (rawSigla === '1º Aux') normSigla = 'A1';
      else if (rawSigla === '2º Aux') normSigla = 'A2';
      else if (rawSigla === 'CZ') normSigla = 'Coz';
      else if (rawSigla === 'PAD-D') normSigla = 'PD';
      else if (rawSigla === 'PAD-N') normSigla = 'PN';
      else if (rawSigla === 'PAD-D+PAD-N') normSigla = 'PD+PN';
      else if (rawSigla === 'C-SGT') normSigla = 'CS';
      else if (rawSigla === 'C-OF') normSigla = 'CO';

      const currentIdx = funcoes.findIndex((f) => f.sigla === normSigla || f.sigla === rawSigla);

      if (currentIdx >= 0 && currentIdx < funcoes.length - 1) {
        const nextFunc = funcoes[currentIdx + 1];
        const newAsg: EscalaAssignment = {
          id: stableId,
          militarId,
          escalaTipo,
          data: dateStr,
          funcaoSigla: nextFunc.sigla,
          funcaoId: nextFunc.id
        };
        toAddOrUpdate = [newAsg];
        return [...cleanPrev, newAsg];
      } else {
        toRemoveIds = existing.map((a) => a.id);
        return cleanPrev;
      }
    });

    updateAssignmentsBatchInFirestore(toAddOrUpdate, toRemoveIds, activeOrgId);
  };

  // Auto-Assign Scale for a Month
  const handleAutoEscalar = (
    escalaTipo: EscalaTipo,
    year: number,
    month: number
  ) => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const formattedMonth = (month + 1).toString().padStart(2, '0');

    let availableMilitary = militares.filter((m) => m.ativo);
    if (escalaTipo !== 'permanencia') {
      const specialized = availableMilitary.filter((m) => m.funcaoPadrao === escalaTipo);
      if (specialized.length > 0) {
        availableMilitary = specialized;
      }
    }

    if (availableMilitary.length === 0) {
      alert('Nenhum militar disponível para auto-escalar nesta modalidade.');
      return;
    }

    const newAssignments: EscalaAssignment[] = [];
    let militaryIndex = 0;

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${formattedMonth}-${day.toString().padStart(2, '0')}`;

      let attempts = 0;
      let assignedMilitar: Militar | null = null;

      while (attempts < availableMilitary.length) {
        const candidate = availableMilitary[militaryIndex % availableMilitary.length];
        militaryIndex++;
        attempts++;

        const isBlocked = destinos.some(
          (d) =>
            d.militarId === candidate.id &&
            d.bloqueiaEscala &&
            dateStr >= d.dataInicio &&
            dateStr <= d.dataFim
        );

        if (!isBlocked) {
          assignedMilitar = candidate;
          break;
        }
      }

      if (assignedMilitar) {
        let defaultSigla = escalasMeta[escalaTipo]?.sigla || 'E';
        if (escalaTipo === 'permanencia') defaultSigla = 'P';
        else if (escalaTipo === 'cozinheiro') defaultSigla = 'Coz';
        else if (escalaTipo === 'aux_cozinheiro') defaultSigla = 'A1';
        else if (escalaTipo === 'cassineiro') defaultSigla = 'CS';
        else if (escalaTipo === 'padeiro') defaultSigla = 'PD';

        newAssignments.push({
          id: `auto-${assignedMilitar.id}-${escalaTipo}-${dateStr}`,
          militarId: assignedMilitar.id,
          escalaTipo,
          funcaoSigla: defaultSigla,
          data: dateStr
        });
      }
    }

    const toRemoveIds = assignments
      .filter((a) => a.escalaTipo === escalaTipo && a.data.startsWith(`${year}-${formattedMonth}`))
      .map((a) => a.id);

    setAssignments((prev) => {
      const filtered = prev.filter((a) => {
        if (a.escalaTipo !== escalaTipo) return true;
        return !a.data.startsWith(`${year}-${formattedMonth}`);
      });
      return [...filtered, ...newAssignments];
    });

    updateAssignmentsBatchInFirestore(newAssignments, toRemoveIds, activeOrgId);
  };

  // Clear Month Assignments for a scale
  const handleClearMonthAssignments = (
    escalaTipo: EscalaTipo,
    year: number,
    month: number
  ) => {
    const formattedMonth = (month + 1).toString().padStart(2, '0');
    const toRemoveIds = assignments
      .filter((a) => a.escalaTipo === escalaTipo && a.data.startsWith(`${year}-${formattedMonth}`))
      .map((a) => a.id);

    setAssignments((prev) =>
      prev.filter((a) => {
        if (a.escalaTipo !== escalaTipo) return true;
        return !a.data.startsWith(`${year}-${formattedMonth}`);
      })
    );

    if (toRemoveIds.length > 0) {
      updateAssignmentsBatchInFirestore([], toRemoveIds, activeOrgId);
    }
  };

  // Organizations & Users Management Handlers
  const handleAddOrganization = (org: Organization) => {
    setOrganizations((prev) => [...prev.filter((o) => o.id !== org.id), org]);
    saveOrganizationToFirestore(org);
  };

  const handleDeleteOrganization = (orgId: string) => {
    setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    if (activeOrgId === orgId) {
      setActiveOrgId('rancho');
    }
    deleteOrganizationFromFirestore(orgId);
  };

  const handleResetToDefaultOrganizations = () => {
    setOrganizations(INITIAL_ORGANIZATIONS);
    saveOrganizationsList(INITIAL_ORGANIZATIONS);
    setActiveOrgId('rancho');
  };

  const handleAddUser = (user: UserAccount) => {
    setUsers((prev) => [...prev.filter((u) => u.id !== user.id), user]);
    saveUserToFirestore(user);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromFirestore(userId);
  };

  const handleRestoreOriginalScaleData = () => {
    setMilitares(INITIAL_MILITARES);
    setAssignments(INITIAL_ASSIGNMENTS);
    setDestinos(INITIAL_DESTINOS);
    setEscalasMeta(ESCALA_METAS);
    setCustomRedDays({});
    const orgToUse = activeOrgId || 'rancho';
    saveMilitaresList(INITIAL_MILITARES, orgToUse);
    saveAssignmentsList(INITIAL_ASSIGNMENTS, orgToUse);
    saveDestinosList(INITIAL_DESTINOS, orgToUse);
    saveEscalasMetaMap(ESCALA_METAS, orgToUse);
    saveRedDaysToFirestore({}, orgToUse);
  };

  // Mission Handlers
  const handleSaveMissao = (missao: Missao) => {
    setMissoes((prev) => {
      const idx = prev.findIndex((m) => m.id === missao.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = missao;
        return copy;
      }
      return [missao, ...prev];
    });
    saveMissao(missao, activeOrgId);
  };

  const handleUpdateMissaoStatus = (missaoId: string, status: Missao['status']) => {
    setMissoes((prev) =>
      prev.map((m) => {
        if (m.id !== missaoId) return m;
        return {
          ...m,
          status,
          updatedAt: new Date().toISOString(),
          dataConclusao: status === 'concluida' ? new Date().toISOString() : undefined
        };
      })
    );
    updateMissaoStatus(missaoId, status, activeOrgId);
  };

  const handleDeleteMissao = (missaoId: string) => {
    setMissoes((prev) => prev.filter((m) => m.id !== missaoId));
    deleteMissao(missaoId, activeOrgId);
  };

  // Agenda Handlers
  const handleSaveAgendaItem = (item: AgendaItem) => {
    setAgenda((prev) => {
      const idx = prev.findIndex((a) => a.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
    saveAgendaItem(item, activeOrgId);
  };

  const handleDeleteAgendaItem = (itemId: string) => {
    setAgenda((prev) => prev.filter((a) => a.id !== itemId));
    deleteAgendaItem(itemId, activeOrgId);
  };

  // Render view depending on appState
  if (appState === 'splash') {
    return <JarvisSplashScreen onComplete={handleSplashComplete} />;
  }

  if (appState === 'login' || !session) {
    return (
      <LoginScreen
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onReplayJarvis={handleReplayAbertura}
      />
    );
  }

  return (
    <NightOpsLayout
      session={session}
      currentPage={currentPage}
      currentOrg={currentOrg}
      onNavigate={(page) => setCurrentPage(page)}
      onLogout={handleLogout}
      onReplayAbertura={handleReplayAbertura}
      badgeCounts={badgeCounts}
    >
      <OfflineBanner />

      <div key={currentPage} className="transition-opacity duration-150 page-fade-in">
        {/* Page 0: Visão Geral / Central Operacional */}
        {currentPage === 'visao_geral' && (
          <VisaoGeralView
            session={session}
            currentOrg={currentOrg}
            militares={militares}
            assignments={assignments}
            escalasMeta={Object.values(escalasMeta)}
            destinos={destinos}
            missoes={missoes}
            agenda={agenda}
            onNavigate={(page) => setCurrentPage(page)}
            onUpdateMissaoStatus={handleUpdateMissaoStatus}
          />
        )}

        {/* Page 1: Main Menu (legacy / customizable quick view) */}
        {currentPage === 'menu' && (
          <MainMenuScreen
            session={session}
            currentOrg={currentOrg}
            onNavigate={(page) => setCurrentPage(page)}
            onUpdateOrgModules={handleUpdateOrgModules}
          />
        )}

        {/* Page 2: Escala Selection Page */}
        {currentPage === 'escala_select' && (
          <EscalasSelectionPage
            militares={militares}
            escalasMeta={escalasMeta}
            onSelectScale={(escala) => {
              setActiveEscala(escala);
              setCurrentPage('escala_detail');
            }}
            onBackToMenu={() => setCurrentPage('visao_geral')}
            onAddMilitar={handleAddMilitar}
            onUpdateMilitar={handleUpdateMilitar}
            onDeleteMilitar={handleDeleteMilitar}
            onDeleteAllMilitares={handleDeleteAllMilitares}
            onAddScale={handleAddScale}
            onDeleteScale={handleDeleteScale}
          />
        )}

        {/* Page 3: Specific Scale Matrix Spreadsheet Page */}
        {currentPage === 'escala_detail' && (
          <EscalasView
            militares={militares}
            assignments={assignments}
            destinos={destinos}
            escalasMeta={escalasMeta}
            activeEscala={activeEscala}
            setActiveEscala={setActiveEscala}
            onBackToScales={() => setCurrentPage('escala_select')}
            onBackToMenu={() => setCurrentPage('visao_geral')}
            onAddMilitar={handleAddMilitar}
            onUpdateMilitar={handleUpdateMilitar}
            onDeleteMilitar={handleDeleteMilitar}
            onDeleteAllMilitares={handleDeleteAllMilitares}
            onAddScale={handleAddScale}
            onDeleteScale={handleDeleteScale}
            onToggleAssignment={handleToggleAssignment}
            onAutoEscalar={handleAutoEscalar}
            onClearMonthAssignments={handleClearMonthAssignments}
            customRedDays={customRedDays}
            onToggleRedDay={handleToggleRedDay}
            onRestoreOriginalScale={handleRestoreOriginalScaleData}
          />
        )}

        {/* Page 4: Mapa da Força Page */}
        {currentPage === 'mapa_forca' && (
          <MapaForcaView
            militares={militares}
            destinos={destinos}
            onReorderMilitares={handleReorderMilitares}
          />
        )}

        {/* Page 5: Aditamento (Militares do Dia) Page */}
        {currentPage === 'aditamento' && (
          <AditamentoView
            militares={militares}
            assignments={assignments}
            escalasMeta={escalasMeta}
            onBackToMenu={() => setCurrentPage('visao_geral')}
          />
        )}

        {/* Page 6: Destinos Page */}
        {currentPage === 'destinos' && (
          <DestinosView
            militares={militares}
            destinos={destinos}
            onAddDestino={handleAddDestino}
            onDeleteDestino={handleDeleteDestino}
          />
        )}

        {/* Page 7: Missões / Planner Operacional */}
        {currentPage === 'missoes' && (
          <MissoesView
            session={session}
            militares={militares}
            users={users}
            missoes={missoes}
            onSaveMissao={handleSaveMissao}
            onUpdateStatus={handleUpdateMissaoStatus}
            onDeleteMissao={handleDeleteMissao}
          />
        )}

        {/* Page 8: Agenda / Planner Mensal */}
        {currentPage === 'agenda' && (
          <AgendaView
            session={session}
            agenda={agenda}
            onSaveAgendaItem={handleSaveAgendaItem}
            onDeleteAgendaItem={handleDeleteAgendaItem}
          />
        )}

        {/* Page 9: Pernoite Page */}
        {currentPage === 'pernoite' && (
          <PernoiteView
            session={session}
            militares={militares}
            assignments={assignments}
            currentOrg={currentOrg}
          />
        )}

        {/* Page 10: Gestão de Acesso & Subunidades Page */}
        {currentPage === 'gestao' && (
          <GestaoView
            session={session}
            organizations={organizations}
            users={users}
            onAddOrganization={handleAddOrganization}
            onDeleteOrganization={handleDeleteOrganization}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onSwitchOrg={(orgId) => setActiveOrgId(orgId)}
            onResetToDefaultOrganizations={handleResetToDefaultOrganizations}
          />
        )}
      </div>
    </NightOpsLayout>
  );
}
