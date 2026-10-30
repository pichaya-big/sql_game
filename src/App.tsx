/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Volume2,
  VolumeX,
  BookOpen,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Award,
  ChevronRight,
  Wand2,
  Cat,
  Shield,
  Coins,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Languages
} from 'lucide-react';

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

export type Language = 'th' | 'en';

export interface BakeryItem {
  id: number;
  name: string;
  category: 'pastry' | 'cookie' | 'cake' | 'berry' | 'bread';
  price: number;
  stock: number;
  sweetness: number;
}

export interface Customer {
  id: number;
  name: string;
  species: string;
  favorite_pastry: string;
  loyalty_tier: 'Bronze' | 'Silver' | 'Gold';
  coins_spent: number;
}

export interface Spell {
  id: number;
  spell_name: string;
  mana_cost: number;
  element: string;
  description: string;
}

export interface QuestText {
  actTitle: string;
  questTitle: string;
  npcName: string;
  dialogue: string;
  objective: string;
  targetHint: string;
  expectedConditionDescription: string;
  badgeReward: string;
  successMessage: string;
}

export interface Quest {
  id: number;
  npcAvatar: string;
  starterSql: string;
  targetTable: string;
  xpReward: number;
  coinReward: number;
  text: {
    th: QuestText;
    en: QuestText;
  };
  validate: (rows: any[], columns: string[], originalQuery: string) => boolean;
}

export interface QueryResult {
  success: boolean;
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTimeMs: number;
  errorMessage?: string;
}

// Initial Database Tables
const INITIAL_BAKERY_ITEMS: BakeryItem[] = [
  { id: 1, name: 'Cloud Croissant', category: 'pastry', price: 35, stock: 14, sweetness: 4 },
  { id: 2, name: 'Star Macaron', category: 'cookie', price: 25, stock: 30, sweetness: 5 },
  { id: 3, name: 'Matcha Chiffon', category: 'cake', price: 65, stock: 8, sweetness: 3 },
  { id: 4, name: 'Berry Mochi Bun', category: 'berry', price: 42, stock: 22, sweetness: 4 },
  { id: 5, name: 'Honey Lavender Roll', category: 'pastry', price: 48, stock: 12, sweetness: 4 },
  { id: 6, name: 'Golden Brioche', category: 'bread', price: 55, stock: 15, sweetness: 2 },
  { id: 7, name: 'Glitter Cupcake', category: 'cake', price: 70, stock: 6, sweetness: 5 },
  { id: 8, name: 'Strawberry Tart', category: 'berry', price: 45, stock: 18, sweetness: 5 },
  { id: 9, name: 'Choco Scone', category: 'pastry', price: 38, stock: 25, sweetness: 3 },
  { id: 10, name: 'Dragonfruit Mousse', category: 'berry', price: 85, stock: 5, sweetness: 4 }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, name: 'Luna the Sprite', species: 'Fairy', favorite_pastry: 'Cloud Croissant', loyalty_tier: 'Gold', coins_spent: 420 },
  { id: 2, name: 'Bramble', species: 'Hedgehog', favorite_pastry: 'Choco Scone', loyalty_tier: 'Silver', coins_spent: 180 },
  { id: 3, name: 'Pip', species: 'Bunny', favorite_pastry: 'Star Macaron', loyalty_tier: 'Bronze', coins_spent: 75 },
  { id: 4, name: 'Archmage Rowan', species: 'Owl', favorite_pastry: 'Matcha Chiffon', loyalty_tier: 'Gold', coins_spent: 980 },
  { id: 5, name: 'Clover', species: 'Squirrel', favorite_pastry: 'Berry Mochi Bun', loyalty_tier: 'Silver', coins_spent: 240 }
];

const INITIAL_SPELLS: Spell[] = [
  { id: 1, spell_name: 'SELECT Sight', mana_cost: 5, element: 'Light', description: 'Reveals hidden rows from ethereal tables' },
  { id: 2, spell_name: 'WHERE Ward', mana_cost: 10, element: 'Filter', description: 'Filters out reality to match sacred conditions' },
  { id: 3, spell_name: 'ORDER Rune', mana_cost: 15, element: 'Cosmos', description: 'Arranges chaos into ascending or descending harmony' },
  { id: 4, spell_name: 'JOIN Tether', mana_cost: 25, element: 'Relational', description: 'Binds two kindred realms across a shared key' }
];

// Bilingual Quests Definitions (Default: Thai)
const QUESTS: Quest[] = [
  {
    id: 1,
    npcAvatar: '🐱🥐',
    starterSql: 'SELECT * FROM bakery_items WHERE price < 50;',
    targetTable: 'bakery_items',
    xpReward: 50,
    coinReward: 30,
    text: {
      th: {
        actTitle: 'องก์ที่ 1: ตรวจนับขนมยามเช้า',
        questTitle: 'เมนูขนมราคาสบายกระเป๋า',
        npcName: 'โมจิ แมวเหมียวนักอบขนม',
        dialogue:
          'เหมียววว! ยินดีต้อนรับสู่ป่าชูก้าร์วู้ดนะเจ้าจอมเวทฝึกหัด! วันนี้พวกภูติตัวจิ๋วในป่าแวะมาที่ร้าน แต่มีเหรียญในกระเป๋าแค่นิดเดียวเอง... ช่วยร่ายมนตร์ SELECT หาขนมทั้งหมดที่มีราคาไม่ถึง 50 เหรียญ (price < 50) ให้หน่อยได้มั้ยเหมียว?',
        objective: 'เขียนคำสั่ง SQL เพื่อเลือกขนมทั้งหมดจาก bakery_items ที่มี price < 50',
        targetHint: 'ลองใช้: SELECT * FROM bakery_items WHERE price < 50;',
        expectedConditionDescription: 'ข้อมูลขนมทั้งหมดที่ price < 50 (พบขนมแสนอร่อย 6 รายการ)',
        badgeReward: 'ผ้ากันเปื้อนผู้ช่วยร้านเบเกอรี่ 🥐',
        successMessage: 'ยอดเยี่ยมมากเหมียว! ขนมราคาประหยัดทั้ง 6 ชิ้นถูกค้นพบแล้ว พวกภูติตัวจิ๋วดีใจกันใหญ่เลย!'
      },
      en: {
        actTitle: 'Act 1: Morning Pastry Inventory',
        questTitle: 'The Sweet Budget',
        npcName: 'Mochi the Baker Cat',
        dialogue:
          "Purr! Welcome to Sugarwood Grove, Apprentice! Forest sprites are visiting today with tiny coin pouches. Can you cast a SELECT spell to find all bakery treats that cost less than 50 coins?",
        objective: 'Write a SQL query to select all items from bakery_items where price < 50.',
        targetHint: 'Try: SELECT * FROM bakery_items WHERE price < 50;',
        expectedConditionDescription: 'All rows where price < 50 (should return 6 delicious treats)',
        badgeReward: 'Bakery Helper Apron 🥐',
        successMessage: "Purrfect! All 6 affordable treats found. The forest sprites are rejoicing!"
      }
    },
    validate: (rows, columns, query) => {
      const q = query.toLowerCase();
      if (!q.includes('bakery_items') || !q.includes('where') || !q.includes('price')) return false;
      if (rows.length !== 6) return false;
      return rows.every(r => typeof r.price === 'number' && r.price < 50);
    }
  },
  {
    id: 2,
    npcAvatar: '🐱🍓',
    starterSql: "SELECT * FROM bakery_items WHERE category = 'berry';",
    targetTable: 'bakery_items',
    xpReward: 75,
    coinReward: 45,
    text: {
      th: {
        actTitle: 'องก์ที่ 2: เทศกาลเบอร์รี่ป่า',
        questTitle: 'ออเดอร์เบอร์รี่หวานฉ่ำ',
        npcName: 'โมจิ แมวเหมียวนักอบขนม',
        dialogue:
          "เหมียว! ฤดูเก็บเกี่ยวผลไม้ป่ามาถึงแล้ว! สัตว์ในป่าบอกว่าอยากกินเฉพาะขนมหวานหมวดเบอร์รี่ทั้งนั้นเลย ร่ายมนตร์ SQL ค้นหาขนมทั้งหมดที่มีหมวดหมู่ category เท่ากับ 'berry' ให้ทีนะ!",
        objective: "เลือกขนมทั้งหมดจาก bakery_items ที่มี category = 'berry'",
        targetHint: "ลองใช้: SELECT * FROM bakery_items WHERE category = 'berry';",
        expectedConditionDescription: "ขนมในหมวด category = 'berry' (Berry Mochi Bun, Strawberry Tart, Dragonfruit Mousse)",
        badgeReward: 'หมวกเบเร่ต์เบอร์รี่ 🍓',
        successMessage: "หอมกลิ่นเบอร์รี่ฟุ้งไปทั่วป่าเลยเหมียว! ได้ขนมเบอร์รี่ครบทั้ง 3 ชนิดเรียบร้อย!"
      },
      en: {
        actTitle: 'Act 2: The Forest Berry Craze',
        questTitle: 'Berry Sweet Deliveries',
        npcName: 'Mochi the Baker Cat',
        dialogue:
          "Meow! The wild strawberry harvest is in! The woodland critters are demanding only our fruity berry pastries. Cast your query spell to summon all items where the category is 'berry'!",
        objective: "Select all items from bakery_items where category = 'berry'.",
        targetHint: "Try: SELECT * FROM bakery_items WHERE category = 'berry';",
        expectedConditionDescription: "Items with category = 'berry' (Berry Mochi Bun, Strawberry Tart, Dragonfruit Mousse)",
        badgeReward: 'Berry Beret 🍓',
        successMessage: "A fruity triumph! All 3 berry treats have been successfully conjured!"
      }
    },
    validate: (rows, columns, query) => {
      const q = query.toLowerCase();
      if (!q.includes('bakery_items') || !q.includes('where')) return false;
      if (rows.length !== 3) return false;
      return rows.every(r => String(r.category).toLowerCase() === 'berry');
    }
  },
  {
    id: 3,
    npcAvatar: '🐱📜',
    starterSql: 'SELECT * FROM bakery_items ORDER BY stock DESC;',
    targetTable: 'bakery_items',
    xpReward: 100,
    coinReward: 60,
    text: {
      th: {
        actTitle: 'องก์ที่ 3: ชั่วโมงเร่งด่วนในร้าน',
        questTitle: 'จัดระเบียบสต็อกขนม',
        npcName: 'โมจิ แมวเหมียวนักอบขนม',
        dialogue:
          'งานเทศกาลเที่ยงวันกำลังจะเริ่มแล้วเหมียว! เราต้องดูขนมที่มีของในสต็อกเยอะที่สุดก่อนเพื่อเตรียมพร้อม ใช้มนตร์จักรวาล ORDER BY เรียงลำดับสต็อก (stock) จากมากไปน้อย (DESC) ให้หน่อย!',
        objective: 'เลือกข้อมูลจาก bakery_items แล้วเรียงลำดับสต็อกแบบมากไปน้อย (stock DESC)',
        targetHint: 'ลองใช้: SELECT * FROM bakery_items ORDER BY stock DESC;',
        expectedConditionDescription: 'ขนมทั้งหมด 10 ชนิด เรียงจากสต็อกมากสุด (Star Macaron, 30 ชิ้น) ไปน้อยสุด',
        badgeReward: 'ไม้กายสิทธิ์นักจัดลำดับ ✨',
        successMessage: 'เรียงลำดับได้เป็นระเบียบสุดยอดเลยเหมียว! ตอนนี้ร้านเบเกอรี่พร้อมรับมือลูกค้าแล้ว!'
      },
      en: {
        actTitle: 'Act 3: The Grand Rush',
        questTitle: 'Inventory Stock Sorting',
        npcName: 'Mochi the Baker Cat',
        dialogue:
          "The noon festival is starting! We must inspect our largest pastry piles first so we don't run out. Use the cosmic ORDER BY spell to sort bakery_items by stock in descending order (DESC)!",
        objective: 'Select all items from bakery_items ordered by stock in descending order (stock DESC).',
        targetHint: 'Try: SELECT * FROM bakery_items ORDER BY stock DESC;',
        expectedConditionDescription: 'All 10 bakery items sorted from highest stock (Star Macaron, 30) down to lowest',
        badgeReward: 'Master Relational Wand ✨',
        successMessage: 'Flawlessly sorted! The bakery shelves are primed for the grand rush!'
      }
    },
    validate: (rows, columns, query) => {
      const q = query.toLowerCase();
      if (!q.includes('order by') || !q.includes('stock') || !q.includes('desc')) return false;
      if (rows.length < 5) return false;
      for (let i = 0; i < rows.length - 1; i++) {
        if (rows[i].stock < rows[i + 1].stock) return false;
      }
      return true;
    }
  },
  {
    id: 4,
    npcAvatar: '🧚✨',
    starterSql: "SELECT * FROM customers WHERE loyalty_tier = 'Gold';",
    targetTable: 'customers',
    xpReward: 150,
    coinReward: 100,
    text: {
      th: {
        actTitle: 'องก์ที่ 4: ขอบคุณลูกค้าคนสำคัญ',
        questTitle: 'แขกคนพิเศษของโมจิ',
        npcName: 'ลูน่า ภูติน้อยแห่งป่า',
        dialogue:
          "ขอพรแห่งประกายเวทมนตร์สถิตกับท่าน! ข้าคือลูน่า ทูตแห่งภูติป่า จอมเวทโรแวนและข้าอยากจัดงานเลี้ยงพระราชทานเพื่อขอบคุณลูกค้าชั้นเลิศ ค้นหาลูกค้าจากตาราง customers ที่มี loyalty_tier เป็น 'Gold' ให้หน่อยสิ!",
        objective: "เลือกข้อมูลจากตาราง customers ที่ loyalty_tier = 'Gold'",
        targetHint: "ลองใช้: SELECT * FROM customers WHERE loyalty_tier = 'Gold';",
        expectedConditionDescription: "ลูกค้าที่มี loyalty_tier = 'Gold' (ลูน่าและมหาจอมเวทโรแวน)",
        badgeReward: 'มงกุฎเกียรติยศแห่ง SQL 👑',
        successMessage: 'พระราชทานพรให้แก่จอมเวท! รายชื่อแขกเกียรติยศครบถ้วน งานเลี้ยงเปิดม่านแล้ว!'
      },
      en: {
        actTitle: 'Act 4: Patron Recognition',
        questTitle: 'Mochi’s VIP Guests',
        npcName: 'Luna the Sprite',
        dialogue:
          "Sparkles and blessings! I am Luna the Sprite Ambassador. Archmage Rowan and I want to organize a royal banquet for the top patrons. Find all patrons from the customers table whose loyalty_tier is 'Gold'!",
        objective: "Select all records from customers where loyalty_tier = 'Gold'.",
        targetHint: "Try: SELECT * FROM customers WHERE loyalty_tier = 'Gold';",
        expectedConditionDescription: "Customers with loyalty_tier = 'Gold' (Luna the Sprite and Archmage Rowan)",
        badgeReward: 'Grand SQL Laureate Crown 👑',
        successMessage: 'The royal banquet guest list is ready! You are a true Grand SQL Master!'
      }
    },
    validate: (rows, columns, query) => {
      const q = query.toLowerCase();
      if (!q.includes('customers') || !q.includes('where')) return false;
      if (rows.length !== 2) return false;
      return rows.every(r => String(r.loyalty_tier).toLowerCase() === 'gold');
    }
  }
];

// ==========================================
// PROCEDURAL AUDIO SYNTHESIZER
// ==========================================

class SoundManager {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playStep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playMeow() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(560, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.35);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  playSpellCast() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + 0.2);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    chord.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + i * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.65);
    });
  }

  playError() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  }
}

const sounds = new SoundManager();

// ==========================================
// EMBEDDED SQL PARSER & EXECUTOR
// ==========================================

function executeSql(
  query: string,
  database: {
    bakery_items: BakeryItem[];
    customers: Customer[];
    spells: Spell[];
  },
  lang: Language
): QueryResult {
  const startTime = performance.now();
  const raw = query.trim().replace(/;+\s*$/, '');

  const errorMessages = {
    empty: lang === 'th' ? 'กรุณากรอกคำสั่งมนตร์ SQL เพื่อร่าย!' : 'Please enter a SQL spell to cast!',
    startWithSelect:
      lang === 'th'
        ? "ในอาณาจักรเวทมนตร์นี้ คำสั่งเรียกดูข้อมูลต้องขึ้นต้นด้วย 'SELECT'!"
        : "In this magical realm, all read queries must begin with 'SELECT'!",
    missingFrom:
      lang === 'th'
        ? "ขาดคำสั่ง 'FROM' แหนะ! ลองระบุชื่อตาราง เช่น 'FROM bakery_items'"
        : "Missing 'FROM' clause! Specify a table like 'FROM bakery_items'.",
    syntaxError:
      lang === 'th'
        ? 'ไวยากรณ์มนตร์ผิดพลาด! รูปแบบที่ถูกต้อง: SELECT <คอลัมน์> FROM <ชื่อตาราง> [WHERE ...] [ORDER BY ...] [LIMIT ...]'
        : 'Syntax error! Expected format: SELECT <cols> FROM <table> [WHERE ...] [ORDER BY ...] [LIMIT ...]',
    unknownTable: (name: string) =>
      lang === 'th'
        ? `ไม่พบตาราง '${name}' ในอาณาจักรนี้! ตารางที่มี: 'bakery_items', 'customers', 'spells'`
        : `Unknown realm table '${name}'. Available tables: 'bakery_items', 'customers', 'spells'.`,
    genericError:
      lang === 'th'
        ? 'มนตร์เกิดสะดุด! โปรดตรวจสอบเงื่อนไขและชื่อคอลัมน์ใหม่อีกครั้ง'
        : 'Spell fizzled! Check query syntax and conditions.'
  };

  if (!raw) {
    return {
      success: false,
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 0,
      errorMessage: errorMessages.empty
    };
  }

  try {
    const selectRegex =
      /^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([\s\S]+?))?(?:\s+LIMIT\s+(\d+))?$/i;
    const match = raw.match(selectRegex);

    if (!match) {
      if (!raw.toUpperCase().startsWith('SELECT')) {
        return {
          success: false,
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: performance.now() - startTime,
          errorMessage: errorMessages.startWithSelect
        };
      }
      if (!raw.toUpperCase().includes('FROM')) {
        return {
          success: false,
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: performance.now() - startTime,
          errorMessage: errorMessages.missingFrom
        };
      }
      return {
        success: false,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: performance.now() - startTime,
        errorMessage: errorMessages.syntaxError
      };
    }

    const [, colPart, tablePart, wherePart, orderPart, limitPart] = match;
    const tableName = tablePart.toLowerCase();

    let sourceData: any[] = [];
    if (tableName === 'bakery_items') {
      sourceData = [...database.bakery_items];
    } else if (tableName === 'customers') {
      sourceData = [...database.customers];
    } else if (tableName === 'spells') {
      sourceData = [...database.spells];
    } else {
      return {
        success: false,
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: performance.now() - startTime,
        errorMessage: errorMessages.unknownTable(tableName)
      };
    }

    let filteredData = sourceData;
    if (wherePart) {
      filteredData = filterRows(filteredData, wherePart);
    }

    if (orderPart) {
      const orderTokens = orderPart.trim().split(/\s+/);
      const orderCol = orderTokens[0].toLowerCase();
      const orderDir = (orderTokens[1] || 'ASC').toUpperCase();

      filteredData.sort((a, b) => {
        const valA = a[orderCol];
        const valB = b[orderCol];

        if (valA === undefined || valB === undefined) return 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return orderDir === 'DESC' ? valB - valA : valA - valB;
        }
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return orderDir === 'DESC' ? 1 : -1;
        if (strA > strB) return orderDir === 'DESC' ? -1 : 1;
        return 0;
      });
    }

    if (limitPart) {
      const limitVal = parseInt(limitPart, 10);
      if (!isNaN(limitVal) && limitVal >= 0) {
        filteredData = filteredData.slice(0, limitVal);
      }
    }

    const trimmedCols = colPart.trim();
    let finalColumns: string[] = [];
    let projectedRows: any[] = [];

    if (trimmedCols === '*') {
      if (filteredData.length > 0) {
        finalColumns = Object.keys(filteredData[0]);
      } else if (sourceData.length > 0) {
        finalColumns = Object.keys(sourceData[0]);
      } else {
        finalColumns = ['id', 'name'];
      }
      projectedRows = filteredData.map(r => ({ ...r }));
    } else {
      const colTokens = trimmedCols.split(',').map(c => c.trim());
      const countStarMatch = colTokens.find(c => c.toUpperCase() === 'COUNT(*)');
      if (countStarMatch && colTokens.length === 1) {
        finalColumns = ['COUNT(*)'];
        projectedRows = [{ 'COUNT(*)': filteredData.length }];
      } else {
        finalColumns = colTokens;
        projectedRows = filteredData.map(row => {
          const item: Record<string, any> = {};
          colTokens.forEach(col => {
            const lowerCol = col.toLowerCase();
            const matchedKey = Object.keys(row).find(k => k.toLowerCase() === lowerCol);
            item[col] = matchedKey ? row[matchedKey] : null;
          });
          return item;
        });
      }
    }

    const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
    return {
      success: true,
      columns: finalColumns,
      rows: projectedRows,
      rowCount: projectedRows.length,
      executionTimeMs: elapsed
    };
  } catch (err: any) {
    return {
      success: false,
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: performance.now() - startTime,
      errorMessage: err.message || errorMessages.genericError
    };
  }
}

function filterRows(rows: any[], whereClause: string): any[] {
  const andClauses = whereClause.split(/\s+AND\s+/i);
  return rows.filter(row => {
    return andClauses.every(clause => evaluateSingleCondition(row, clause.trim()));
  });
}

function evaluateSingleCondition(row: any, condition: string): boolean {
  const cond = condition.trim();
  const match = cond.match(/^([a-zA-Z0-9_]+)\s*(<=|>=|!=|<>|<|>|=|LIKE)\s*(.+)$/i);
  if (!match) return true;

  const [, rawCol, rawOp, rawVal] = match;
  const colName = rawCol.toLowerCase();
  const operator = rawOp.toUpperCase();

  const rowKey = Object.keys(row).find(k => k.toLowerCase() === colName);
  if (!rowKey) return false;
  const cellVal = row[rowKey];

  let targetValStr = rawVal.trim();
  let targetVal: any = targetValStr;

  if (
    (targetValStr.startsWith("'") && targetValStr.endsWith("'")) ||
    (targetValStr.startsWith('"') && targetValStr.endsWith('"'))
  ) {
    targetVal = targetValStr.slice(1, -1);
  } else if (!isNaN(Number(targetValStr))) {
    targetVal = Number(targetValStr);
  }

  if (operator === '=') {
    if (typeof cellVal === 'string' && typeof targetVal === 'string') {
      return cellVal.toLowerCase() === targetVal.toLowerCase();
    }
    return cellVal == targetVal;
  }
  if (operator === '!=' || operator === '<>') {
    if (typeof cellVal === 'string' && typeof targetVal === 'string') {
      return cellVal.toLowerCase() !== targetVal.toLowerCase();
    }
    return cellVal != targetVal;
  }
  if (operator === '<') {
    return Number(cellVal) < Number(targetVal);
  }
  if (operator === '<=') {
    return Number(cellVal) <= Number(targetVal);
  }
  if (operator === '>') {
    return Number(cellVal) > Number(targetVal);
  }
  if (operator === '>=') {
    return Number(cellVal) >= Number(targetVal);
  }
  if (operator === 'LIKE') {
    const pattern = String(targetVal).toLowerCase().replace(/%/g, '.*');
    const regex = new RegExp(`^${pattern}$`, 'i');
    return regex.test(String(cellVal));
  }

  return true;
}

// ==========================================
// MAIN COMPONENT: SQL QUEST (THAI VERSION)
// ==========================================

export default function App() {
  // Language State: Default to Thai ('th') per user request
  const [lang, setLang] = useState<Language>('th');

  // Database State
  const [database] = useState({
    bakery_items: INITIAL_BAKERY_ITEMS,
    customers: INITIAL_CUSTOMERS,
    spells: INITIAL_SPELLS
  });

  // Game Progress State
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [playerXp, setPlayerXp] = useState(0);
  const [starCoins, setStarCoins] = useState(15);
  const [completedQuests, setCompletedQuests] = useState<number[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Active Quest Details
  const activeQuest = QUESTS[currentQuestIndex] || QUESTS[0];
  const questText = activeQuest.text[lang];
  const isCurrentQuestCompleted = completedQuests.includes(activeQuest.id);

  // SQL Console State
  const [sqlQuery, setSqlQuery] = useState<string>(activeQuest.starterSql);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'schema' | 'spellbook'>('console');
  const [activeSchemaTable, setActiveSchemaTable] = useState<'bakery_items' | 'customers' | 'spells'>('bakery_items');
  const [showHint, setShowHint] = useState(false);
  const [catDialoguePopup, setCatDialoguePopup] = useState<string | null>(null);

  // Canvas & Three.js Refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneBridgeRef = useRef<{
    triggerSpellAnimation: () => void;
    playerMove: (dx: number, dz: number) => void;
    isNearCat: boolean;
  }>({
    triggerSpellAnimation: () => {},
    playerMove: () => {},
    isNearCat: false
  });

  const [isPlayerNearCat, setIsPlayerNearCat] = useState(false);

  // Sync initial query and dialogue when quest or language changes
  useEffect(() => {
    setSqlQuery(activeQuest.starterSql);
    setQueryResult(null);
    setShowHint(false);
    setCatDialoguePopup(activeQuest.text[lang].dialogue);
  }, [currentQuestIndex, activeQuest, lang]);

  // Audio mute toggle
  const toggleAudio = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    sounds.muted = next;
  };

  // Toggle Language between Thai and English
  const toggleLanguage = () => {
    const nextLang: Language = lang === 'th' ? 'en' : 'th';
    setLang(nextLang);
  };

  // ==========================================
  // THREE.JS 3D INTERACTIVE SCENE
  // ==========================================

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let animationFrameId = 0;
    let isDisposed = false;

    // Detect software WebGL per Three.js skill
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#EBF5FB');
    scene.fog = new THREE.FogExp2('#EBF5FB', 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 11, 13);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight('#FFF9F5', '#D4EFDF', 1.1);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#FFF3E0', 1.8);
    dirLight.position.set(7, 16, 9);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const d = 10;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight('#FADBD8', 0.4);
    scene.add(ambientLight);

    // Ground & Stepping Stones
    const groundGeo = new THREE.PlaneGeometry(28, 28, 16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#D4EFDF',
      roughness: 0.85,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    const stoneGroup = new THREE.Group();
    const stoneGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.08, 7);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: '#FCF3CF',
      roughness: 0.9,
      metalness: 0.05
    });

    const stoneCoords = [
      [0, 0], [0.3, -0.9], [-0.2, -1.8], [0.5, -2.7], [1.2, -3.2],
      [-0.4, 0.9], [-0.8, 1.8], [-1.5, 2.4], [-2.2, 2.7], [-3.0, 2.8]
    ];
    stoneCoords.forEach(([sx, sz], i) => {
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(sx, 0.04, sz);
      stone.rotation.y = i * 0.4;
      stone.scale.set(1 + (i % 3) * 0.1, 1, 0.9 + (i % 2) * 0.2);
      stone.receiveShadow = !isSoftwareGl;
      stoneGroup.add(stone);
    });
    scene.add(stoneGroup);

    // Bakery Stand
    const bakeryGroup = new THREE.Group();
    bakeryGroup.position.set(-3.2, 0, 2.8);
    bakeryGroup.rotation.y = Math.PI / 4;

    const counterGeo = new THREE.BoxGeometry(2.4, 0.9, 1.0);
    const counterMat = new THREE.MeshStandardMaterial({ color: '#EDBB99', roughness: 0.8 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.y = 0.45;
    counter.castShadow = !isSoftwareGl;
    counter.receiveShadow = !isSoftwareGl;
    bakeryGroup.add(counter);

    const counterTopGeo = new THREE.BoxGeometry(2.6, 0.1, 1.15);
    const counterTopMat = new THREE.MeshStandardMaterial({ color: '#FFF9F5', roughness: 0.6 });
    const counterTop = new THREE.Mesh(counterTopGeo, counterTopMat);
    counterTop.position.y = 0.95;
    counterTop.castShadow = !isSoftwareGl;
    bakeryGroup.add(counterTop);

    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: '#5C4033', roughness: 0.7 });
    [-1.15, 1.15].forEach(px => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, 1.7, 0.45);
      post.castShadow = !isSoftwareGl;
      bakeryGroup.add(post);
    });

    const awningGroup = new THREE.Group();
    awningGroup.position.set(0, 2.45, 0.2);
    awningGroup.rotation.x = 0.25;

    const stripeWidth = 2.7 / 6;
    for (let i = 0; i < 6; i++) {
      const stripeGeo = new THREE.BoxGeometry(stripeWidth, 0.06, 1.2);
      const stripeMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? '#FADBD8' : '#FFF9F5',
        roughness: 0.7
      });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.x = -1.35 + stripeWidth * i + stripeWidth / 2;
      stripe.castShadow = !isSoftwareGl;
      awningGroup.add(stripe);
    }
    bakeryGroup.add(awningGroup);

    const croissantGeo = new THREE.TorusGeometry(0.12, 0.06, 8, 12, Math.PI * 1.3);
    const pastryMat = new THREE.MeshStandardMaterial({ color: '#F5B041', roughness: 0.4 });
    const croissant = new THREE.Mesh(croissantGeo, pastryMat);
    croissant.position.set(-0.7, 1.05, 0.1);
    croissant.rotation.x = Math.PI / 2;
    croissant.castShadow = !isSoftwareGl;
    bakeryGroup.add(croissant);

    const macaronGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
    const macaronMat = new THREE.MeshStandardMaterial({ color: '#F1948A', roughness: 0.3 });
    const macaron = new THREE.Mesh(macaronGeo, macaronMat);
    macaron.position.set(-0.35, 1.03, 0.15);
    bakeryGroup.add(macaron);

    const lanternGeo = new THREE.DodecahedronGeometry(0.12);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: '#F9E79F',
      emissive: '#F39C12',
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(1.15, 2.2, 0.45);
    bakeryGroup.add(lantern);

    scene.add(bakeryGroup);

    // Mochi the Baker Cat Model
    const catGroup = new THREE.Group();
    catGroup.position.set(-3.2, 0.98, 2.4);
    catGroup.rotation.y = Math.PI / 3;

    const catBodyGeo = new THREE.SphereGeometry(0.35, 16, 14);
    catBodyGeo.scale(0.9, 1.05, 0.9);
    const catFurMat = new THREE.MeshStandardMaterial({ color: '#F8C471', roughness: 0.7 });
    const catBody = new THREE.Mesh(catBodyGeo, catFurMat);
    catBody.position.y = 0.35;
    catBody.castShadow = !isSoftwareGl;
    catGroup.add(catBody);

    const catHeadGeo = new THREE.SphereGeometry(0.28, 16, 14);
    catHeadGeo.scale(1.05, 0.95, 0.95);
    const catHead = new THREE.Mesh(catHeadGeo, catFurMat);
    catHead.position.set(0, 0.72, 0.08);
    catHead.castShadow = !isSoftwareGl;
    catGroup.add(catHead);

    const earGeo = new THREE.ConeGeometry(0.1, 0.18, 4);
    const earMat = new THREE.MeshStandardMaterial({ color: '#F5B041', roughness: 0.7 });

    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.16, 0.96, 0.05);
    leftEar.rotation.z = 0.25;
    catGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.16, 0.96, 0.05);
    rightEar.rotation.z = -0.25;
    catGroup.add(rightEar);

    const chefHatGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.2, 12);
    const chefHatPuffGeo = new THREE.SphereGeometry(0.2, 12, 10);
    const chefHatMat = new THREE.MeshStandardMaterial({ color: '#FFF9F5', roughness: 0.5 });
    const chefHat = new THREE.Mesh(chefHatGeo, chefHatMat);
    chefHat.position.set(0, 1.05, 0.04);
    const chefPuff = new THREE.Mesh(chefHatPuffGeo, chefHatMat);
    chefPuff.position.set(0, 1.16, 0.04);
    catGroup.add(chefHat);
    catGroup.add(chefPuff);

    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: '#5C4033', roughness: 0.2 });
    [-0.09, 0.09].forEach(ex => {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(ex, 0.74, 0.32);
      catGroup.add(eye);
    });

    const noseGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: '#F1948A', roughness: 0.4 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.69, 0.34);
    catGroup.add(nose);

    const tailCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.2, -0.25),
      new THREE.Vector3(0.25, 0.45, -0.45),
      new THREE.Vector3(0.1, 0.7, -0.35)
    );
    const tailGeo = new THREE.TubeGeometry(tailCurve, 12, 0.04, 6, false);
    const catTail = new THREE.Mesh(tailGeo, catFurMat);
    catGroup.add(catTail);

    scene.add(catGroup);

    // Alert Bubble
    const alertBubbleGroup = new THREE.Group();
    alertBubbleGroup.position.set(-3.2, 2.6, 2.4);
    const alertBgGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const alertBgMat = new THREE.MeshStandardMaterial({
      color: '#FCF3CF',
      emissive: '#F9E79F',
      emissiveIntensity: 0.4,
      roughness: 0.3
    });
    const alertBg = new THREE.Mesh(alertBgGeo, alertBgMat);
    alertBubbleGroup.add(alertBg);

    const markStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8);
    const markDotGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const markMat = new THREE.MeshStandardMaterial({ color: '#5C4033', roughness: 0.3 });
    const markStem = new THREE.Mesh(markStemGeo, markMat);
    markStem.position.y = 0.04;
    const markDot = new THREE.Mesh(markDotGeo, markMat);
    markDot.position.y = -0.12;
    alertBubbleGroup.add(markStem);
    alertBubbleGroup.add(markDot);
    scene.add(alertBubbleGroup);

    // Relational Database Obelisk
    const obeliskGroup = new THREE.Group();
    obeliskGroup.position.set(3.5, 0, -2.5);

    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.7, 2.8, 6);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: '#D4E6F1',
      roughness: 0.4,
      metalness: 0.2
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 1.4;
    pillar.castShadow = !isSoftwareGl;
    pillar.receiveShadow = !isSoftwareGl;
    obeliskGroup.add(pillar);

    const crystalGeo = new THREE.OctahedronGeometry(0.45);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: '#BB8FCE',
      emissive: '#8E44AD',
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.5
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 3.3;
    obeliskGroup.add(crystal);

    const stepGeo = new THREE.CylinderGeometry(0.9, 1.1, 0.2, 6);
    const stepMat = new THREE.MeshStandardMaterial({ color: '#FCF3CF', roughness: 0.8 });
    const step = new THREE.Mesh(stepGeo, stepMat);
    step.position.y = 0.1;
    step.receiveShadow = !isSoftwareGl;
    obeliskGroup.add(step);

    scene.add(obeliskGroup);

    // Cozy Trees & Bushes
    const foliageGroup = new THREE.Group();
    const createCozyTree = (x: number, z: number, scale: number = 1, foliageColor: string = '#A3E4D7') => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.set(scale, scale, scale);

      const trunkGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.4, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#784212', roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.7;
      trunk.castShadow = !isSoftwareGl;
      tree.add(trunk);

      const puffMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.7 });
      const p1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95), puffMat);
      p1.position.y = 1.6;
      p1.castShadow = !isSoftwareGl;
      tree.add(p1);

      const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75), puffMat);
      p2.position.set(0.1, 2.3, 0.1);
      p2.castShadow = !isSoftwareGl;
      tree.add(p2);

      const p3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), puffMat);
      p3.position.set(-0.05, 2.8, -0.05);
      p3.castShadow = !isSoftwareGl;
      tree.add(p3);

      return tree;
    };

    foliageGroup.add(createCozyTree(-5.5, -3.5, 1.2, '#A2D9CE'));
    foliageGroup.add(createCozyTree(-4.2, -5.5, 1.0, '#EDBB99'));
    foliageGroup.add(createCozyTree(5.0, 3.5, 1.1, '#A9DFBF'));
    foliageGroup.add(createCozyTree(4.2, -5.0, 1.3, '#A3E4D7'));
    foliageGroup.add(createCozyTree(-0.5, -6.5, 1.2, '#D2B4DE'));

    const bushGeo = new THREE.DodecahedronGeometry(0.45);
    const bushMat = new THREE.MeshStandardMaterial({ color: '#A9DFBF', roughness: 0.8 });
    [[-1.8, 2.0], [1.8, -1.5], [2.8, 1.5], [-2.0, -2.5]].forEach(([bx, bz]) => {
      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.position.set(bx, 0.35, bz);
      bush.castShadow = !isSoftwareGl;
      foliageGroup.add(bush);
    });

    scene.add(foliageGroup);

    // Chibi Player Model
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 0);

    const shadowGeo = new THREE.CircleGeometry(0.45, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#5C4033',
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.02;
    playerGroup.add(contactShadow);

    const robeGeo = new THREE.CylinderGeometry(0.22, 0.42, 0.85, 12);
    const robeMat = new THREE.MeshStandardMaterial({ color: '#BB8FCE', roughness: 0.7 });
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.52;
    robe.castShadow = !isSoftwareGl;
    playerGroup.add(robe);

    const headGeo = new THREE.SphereGeometry(0.32, 16, 14);
    const skinMat = new THREE.MeshStandardMaterial({ color: '#FDEBD0', roughness: 0.6 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.08;
    head.castShadow = !isSoftwareGl;
    playerGroup.add(head);

    const blushGeo = new THREE.CircleGeometry(0.045, 8);
    const blushMat = new THREE.MeshBasicMaterial({ color: '#F1948A', depthWrite: false });
    [-0.14, 0.14].forEach(bx => {
      const blush = new THREE.Mesh(blushGeo, blushMat);
      blush.position.set(bx, 1.02, 0.3);
      playerGroup.add(blush);
    });

    const playerEyeGeo = new THREE.CapsuleGeometry(0.035, 0.05, 4, 8);
    const playerEyeMat = new THREE.MeshStandardMaterial({ color: '#5C4033', roughness: 0.2 });
    [-0.11, 0.11].forEach(ex => {
      const eye = new THREE.Mesh(playerEyeGeo, playerEyeMat);
      eye.position.set(ex, 1.09, 0.29);
      playerGroup.add(eye);
    });

    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 1.25, 0);

    const hatBrimGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: '#8E44AD', roughness: 0.6 });
    const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
    hatGroup.add(hatBrim);

    const hatConeGeo = new THREE.ConeGeometry(0.35, 0.7, 12);
    const hatCone = new THREE.Mesh(hatConeGeo, hatMat);
    hatCone.position.set(0, 0.35, -0.05);
    hatCone.rotation.x = -0.15;
    hatGroup.add(hatCone);

    const ribbonGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 12);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: '#F9E79F', roughness: 0.4 });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0, 0.06, 0);
    hatGroup.add(ribbon);

    playerGroup.add(hatGroup);

    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.42, 0.4, 0.15);

    const staffPoleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.35, 8);
    const staffPoleMat = new THREE.MeshStandardMaterial({ color: '#784212', roughness: 0.7 });
    const staffPole = new THREE.Mesh(staffPoleGeo, staffPoleMat);
    staffPole.position.y = 0.45;
    staffPole.castShadow = !isSoftwareGl;
    staffGroup.add(staffPole);

    const starGeo = new THREE.OctahedronGeometry(0.14);
    const starMat = new THREE.MeshStandardMaterial({
      color: '#F9E79F',
      emissive: '#F1C40F',
      emissiveIntensity: 0.7,
      roughness: 0.2
    });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.y = 1.15;
    staffGroup.add(star);

    playerGroup.add(staffGroup);

    const shieldGeo = new THREE.BoxGeometry(0.08, 0.4, 0.3);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: '#A9DFBF',
      roughness: 0.5,
      metalness: 0.1
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(-0.4, 0.6, 0.05);
    playerGroup.add(shield);

    scene.add(playerGroup);

    // Spell Burst Particles
    const particleCount = 45;
    const particleGeo = new THREE.DodecahedronGeometry(0.06);
    const particleMat = new THREE.MeshStandardMaterial({
      color: '#FADBD8',
      emissive: '#F1948A',
      emissiveIntensity: 1.0,
      roughness: 0.2
    });

    const particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      const pMesh = new THREE.Mesh(particleGeo, particleMat);
      pMesh.visible = false;
      scene.add(pMesh);
      particles.push({
        mesh: pMesh,
        vel: new THREE.Vector3(),
        life: 0
      });
    }

    const triggerSpellBurst = () => {
      sounds.playSpellCast();
      const origin = playerGroup.position.clone().add(new THREE.Vector3(0.4, 1.5, 0.2));

      particles.forEach((p, idx) => {
        p.mesh.position.copy(origin);
        p.mesh.visible = true;
        const angle = (idx / particleCount) * Math.PI * 2;
        const speed = 2.5 + Math.random() * 3.5;
        p.vel.set(Math.cos(angle) * speed, 1.8 + Math.random() * 3.0, Math.sin(angle) * speed);
        p.life = 1.0;
      });
    };

    sceneBridgeRef.current.triggerSpellAnimation = triggerSpellBurst;

    // Movement state
    const playerPos = { x: 0, z: 0 };
    const playerTargetPos = { x: 0, z: 0 };
    let playerAngle = 0;
    let walkBobTimer = 0;
    let isMoving = false;

    sceneBridgeRef.current.playerMove = (dx: number, dz: number) => {
      playerTargetPos.x = Math.max(-8, Math.min(8, playerTargetPos.x + dx));
      playerTargetPos.z = Math.max(-8, Math.min(8, playerTargetPos.z + dz));
      sounds.playStep();
    };

    const heldKeys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
        return;
      }

      heldKeys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        const distToCat = Math.hypot(playerPos.x - catGroup.position.x, playerPos.z - catGroup.position.z);
        if (distToCat < 2.8) {
          sounds.playMeow();
          setCatDialoguePopup(
            (lang === 'th' ? "เหมียววว! " : "Meow! ") +
              (isCurrentQuestCompleted
                ? (lang === 'th' ? "ร่ายมนตร์สำเร็จแล้ว! พร้อมไปลุยภารกิจต่อไปมั้ยเหมียว?" : "Splendid spellcasting! Ready for the next quest?")
                : questText.dialogue)
          );
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObject(ground);
      if (intersects.length > 0) {
        const pt = intersects[0].point;
        playerTargetPos.x = Math.max(-8, Math.min(8, pt.x));
        playerTargetPos.z = Math.max(-8, Math.min(8, pt.z));
      }

      const catIntersects = raycaster.intersectObjects(catGroup.children, true);
      if (catIntersects.length > 0) {
        sounds.playMeow();
        setCatDialoguePopup(
          lang === 'th'
            ? 'เหมียว! จอมเวทฝึกหัด มีอะไรให้ข้าช่วยเรื่องมนตร์ SQL มั้ยเหมียว?'
            : 'Meow! Greetings, little Wizard! Need help with your SQL spell?'
        );
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    let clock = new THREE.Clock();

    const tick = () => {
      if (isDisposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);

      let moveX = 0;
      let moveZ = 0;
      if (heldKeys['ArrowUp'] || heldKeys['w'] || heldKeys['W']) moveZ -= 1;
      if (heldKeys['ArrowDown'] || heldKeys['s'] || heldKeys['S']) moveZ += 1;
      if (heldKeys['ArrowLeft'] || heldKeys['a'] || heldKeys['A']) moveX -= 1;
      if (heldKeys['ArrowRight'] || heldKeys['d'] || heldKeys['D']) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const speed = 4.2 * dt;
        playerTargetPos.x = Math.max(-8, Math.min(8, playerTargetPos.x + moveX * speed));
        playerTargetPos.z = Math.max(-8, Math.min(8, playerTargetPos.z + moveZ * speed));
      }

      const dx = playerTargetPos.x - playerPos.x;
      const dz = playerTargetPos.z - playerPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.05) {
        isMoving = true;
        const moveStep = Math.min(dist, 5.0 * dt);
        playerPos.x += (dx / dist) * moveStep;
        playerPos.z += (dz / dist) * moveStep;
        playerAngle = Math.atan2(dx, dz);
        walkBobTimer += dt * 14;

        if (Math.sin(walkBobTimer) > 0.95 && Math.random() < 0.2) {
          sounds.playStep();
        }
      } else {
        isMoving = false;
        walkBobTimer = 0;
      }

      playerGroup.position.x = playerPos.x;
      playerGroup.position.z = playerPos.z;
      playerGroup.rotation.y = THREE.MathUtils.damp(playerGroup.rotation.y, playerAngle, 12, dt);

      const bobY = isMoving ? Math.abs(Math.sin(walkBobTimer)) * 0.12 : 0;
      playerGroup.position.y = bobY;

      staffGroup.rotation.x = isMoving ? Math.sin(walkBobTimer) * 0.3 : 0;
      star.rotation.y += dt * 2.0;
      star.scale.setScalar(1.0 + Math.sin(clock.getElapsedTime() * 4) * 0.1);

      const time = clock.getElapsedTime();
      catBody.position.y = 0.35 + Math.sin(time * 3) * 0.015;
      catTail.rotation.y = Math.sin(time * 2.5) * 0.25;

      alertBubbleGroup.position.y = 2.6 + Math.sin(time * 3.5) * 0.12;

      crystal.position.y = 3.3 + Math.sin(time * 2.0) * 0.15;
      crystal.rotation.y += dt * 0.8;
      crystal.rotation.x = Math.sin(time) * 0.2;

      const distToCat = Math.hypot(playerPos.x - catGroup.position.x, playerPos.z - catGroup.position.z);
      const near = distToCat < 2.8;
      if (near !== sceneBridgeRef.current.isNearCat) {
        sceneBridgeRef.current.isNearCat = near;
        setIsPlayerNearCat(near);
      }

      const targetCamX = playerPos.x * 0.3;
      const targetCamZ = playerPos.z * 0.3 + 12;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 4, dt);

      particles.forEach(p => {
        if (!p.mesh.visible) return;
        p.life -= dt * 1.5;
        if (p.life <= 0) {
          p.mesh.visible = false;
        } else {
          p.mesh.position.addScaledVector(p.vel, dt);
          p.vel.y -= 7.0 * dt;
          p.mesh.scale.setScalar(p.life);
        }
      });

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lang, isCurrentQuestCompleted, questText]);

  // ==========================================
  // SQL SPELL CASTING LOGIC
  // ==========================================

  const handleCastSpell = useCallback(() => {
    sceneBridgeRef.current.triggerSpellAnimation();

    const result = executeSql(sqlQuery, database, lang);
    setQueryResult(result);

    if (!result.success) {
      sounds.playError();
      return;
    }

    const passed = activeQuest.validate(result.rows, result.columns, sqlQuery);

    if (passed) {
      sounds.playSuccess();

      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#FADBD8', '#E8F8F5', '#FCF3CF', '#D4E6F1', '#D2B4DE']
      });

      if (!completedQuests.includes(activeQuest.id)) {
        setCompletedQuests(prev => [...prev, activeQuest.id]);
        setPlayerXp(prev => prev + activeQuest.xpReward);
        setStarCoins(prev => prev + activeQuest.coinReward);
        if (!unlockedBadges.includes(questText.badgeReward)) {
          setUnlockedBadges(prev => [...prev, questText.badgeReward]);
        }
      }

      setCatDialoguePopup(
        (lang === 'th' ? "เหมียววว! ยอดเยี่ยมมาก ✨ " : "Purrfect! ✨ ") +
          `${questText.npcName}: "${questText.successMessage}"`
      );
    }
  }, [sqlQuery, database, activeQuest, questText, completedQuests, unlockedBadges, lang]);

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCastSpell();
    }
  };

  const insertTemplate = (template: string) => {
    setSqlQuery(template);
  };

  const handleNextQuest = () => {
    if (currentQuestIndex < QUESTS.length - 1) {
      setCurrentQuestIndex(prev => prev + 1);
    } else {
      setCurrentQuestIndex(0);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FFF9F5] text-[#5C4033] font-prompt select-none">
      {/* ---------------------------------------------------- */}
      {/* TOP COZY GAME NAVBAR                                 */}
      {/* ---------------------------------------------------- */}
      <header className="flex-none bg-[#FFF9F5] border-b-2 border-[#5C4033] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shadow-xs z-20">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FADBD8] magic-border-sm flex items-center justify-center text-xl shadow-xs">
            🧙‍♂️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-wide text-[#5C4033] font-pixel">
                SQL QUEST
              </h1>
              <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-[#E8F8F5] border border-[#A2D9CE] text-[#1E8449] font-medium font-prompt">
                {lang === 'th' ? 'ดินแดนแห่งความสัมพันธ์' : 'The Relational Realm'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#8D6E63] flex items-center gap-1.5 sm:gap-2">
              <span>{questText.actTitle}</span>
              <span>•</span>
              <span className="text-[#AF601A] font-medium">{questText.questTitle}</span>
            </p>
          </div>
        </div>

        {/* Player Stats, Language Switcher & Audio */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#E8F8F5] hover:bg-[#D4EFDF] text-[#16A085] font-bold text-xs magic-border-sm magic-border-pressed cursor-pointer transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? '🇹🇭 ไทย' : '🇬🇧 EN'}</span>
          </button>

          {/* XP & Level Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#E8F8F5] px-2.5 py-1 rounded-xl magic-border-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#16A085]" />
            <div className="text-xs">
              <span className="font-bold text-[#16A085]">{playerXp} XP</span>
              <span className="text-[#5C4033] ml-1">
                ({lang === 'th' ? 'จอมเวท Lv.' : 'Lvl '}
                {Math.floor(playerXp / 100) + 1})
              </span>
            </div>
          </div>

          {/* Star Coins */}
          <div className="flex items-center gap-1 bg-[#FCF3CF] px-2.5 py-1 rounded-xl magic-border-sm">
            <Coins className="w-3.5 h-3.5 text-[#D4AC0D]" />
            <span className="text-xs font-bold text-[#7D6608]">
              {starCoins} {lang === 'th' ? 'เหรียญ' : 'Coins'}
            </span>
          </div>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleAudio}
            title={isAudioMuted ? 'เปิดเสียงเกม' : 'ปิดเสียงเกม'}
            className="p-1.5 sm:p-2 rounded-xl bg-[#FADBD8] hover:bg-[#F5B7B1] text-[#5C4033] magic-border-sm magic-border-pressed transition-colors cursor-pointer"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* MAIN SPLIT-SCREEN CONTAINER                          */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* ================================================== */}
        {/* LEFT VIEWPORT: 3D INTERACTIVE REALM                */}
        {/* ================================================== */}
        <section className="relative flex-1 lg:w-1/2 h-[45vh] lg:h-full bg-[#EBF5FB] border-b-2 lg:border-b-0 lg:border-r-2 border-[#5C4033] overflow-hidden select-none">
          {/* Three.js Canvas Container */}
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* 3D Viewport Floating Info Overlays */}
          <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1 z-10">
            <div className="bg-[#FFF9F5]/90 border-2 border-[#5C4033] px-2.5 py-1 rounded-xl shadow-xs text-xs font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#27AE60] inline-block" />
              <span>{lang === 'th' ? 'หมู่บ้านป่าชูก้าร์วู้ด' : 'Sugarwood Grove Village'}</span>
            </div>
            <div className="text-[11px] text-[#5C4033]/90 bg-[#FFF9F5]/75 px-2 py-0.5 rounded-lg border border-[#5C4033]/30 w-fit">
              {lang === 'th' ? (
                <>ใช้ปุ่มลูกศร <kbd className="font-mono font-bold">Arrow Keys</kbd> หรือ <kbd className="font-mono font-bold">WASD</kbd> เพื่อเดิน</>
              ) : (
                <>Use <kbd className="font-mono font-bold">Arrow Keys</kbd> or <kbd className="font-mono font-bold">WASD</kbd> to move</>
              )}
            </div>
          </div>

          {/* Cat Proximity Alert Banner */}
          {isPlayerNearCat && (
            <div className="absolute top-3 right-3 z-10 animate-bounce">
              <button
                onClick={() => {
                  sounds.playMeow();
                  setCatDialoguePopup(
                    (lang === 'th' ? "เหมียววว! " : "Meow! ") +
                      (isCurrentQuestCompleted
                        ? (lang === 'th' ? "ร่ายมนตร์สำเร็จแล้ว! สุดยอดไปเลยจอมเวทน้อย!" : "Great job casting that spell!")
                        : questText.dialogue)
                  );
                }}
                className="bg-[#FCF3CF] hover:bg-[#F9E79F] border-2 border-[#5C4033] px-3 py-1.5 rounded-xl shadow-md text-xs font-bold text-[#7D6608] flex items-center gap-1.5 cursor-pointer transition-transform"
              >
                <Cat className="w-4 h-4 text-[#D35400]" />
                <span>{lang === 'th' ? 'คุยกับเจ้าเหมียวโมจิ [Space / E]' : 'Talk to Mochi [Space / E]'}</span>
              </button>
            </div>
          )}

          {/* Floating Cat Dialogue Speech Box */}
          {catDialoguePopup && (
            <div className="absolute bottom-16 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md bg-[#FFF9F5] border-3 border-[#5C4033] p-3.5 rounded-2xl shadow-lg z-20 transition-all">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeQuest.npcAvatar}</span>
                  <span className="font-bold text-xs text-[#AF601A] uppercase tracking-wider">
                    {questText.npcName}
                  </span>
                </div>
                <button
                  onClick={() => setCatDialoguePopup(null)}
                  className="text-[#8D6E63] hover:text-[#5C4033] p-0.5 rounded hover:bg-[#FADBD8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#5C4033] leading-relaxed font-medium">
                {catDialoguePopup}
              </p>
            </div>
          )}

          {/* On-Screen D-Pad */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col items-center gap-1 bg-[#FFF9F5]/90 p-1.5 rounded-2xl border-2 border-[#5C4033] shadow-xs">
            <button
              onClick={() => sceneBridgeRef.current.playerMove(0, -1.2)}
              title={lang === 'th' ? 'เดินขึ้น' : 'Move Up'}
              className="w-7 h-7 rounded-lg bg-[#E8F8F5] hover:bg-[#A2D9CE] border border-[#5C4033] flex items-center justify-center text-[#5C4033] active:translate-y-0.5 cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => sceneBridgeRef.current.playerMove(-1.2, 0)}
                title={lang === 'th' ? 'เดินซ้าย' : 'Move Left'}
                className="w-7 h-7 rounded-lg bg-[#E8F8F5] hover:bg-[#A2D9CE] border border-[#5C4033] flex items-center justify-center text-[#5C4033] active:translate-x-0.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => sceneBridgeRef.current.playerMove(0, 1.2)}
                title={lang === 'th' ? 'เดินลง' : 'Move Down'}
                className="w-7 h-7 rounded-lg bg-[#E8F8F5] hover:bg-[#A2D9CE] border border-[#5C4033] flex items-center justify-center text-[#5C4033] active:translate-y-0.5 cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => sceneBridgeRef.current.playerMove(1.2, 0)}
                title={lang === 'th' ? 'เดินขวา' : 'Move Right'}
                className="w-7 h-7 rounded-lg bg-[#E8F8F5] hover:bg-[#A2D9CE] border border-[#5C4033] flex items-center justify-center text-[#5C4033] active:translate-x-0.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* RIGHT PANEL: COZY PASTEL SQL SPELL CONSOLE         */}
        {/* ================================================== */}
        <section className="flex-1 lg:w-1/2 h-[55vh] lg:h-full bg-[#FFF9F5] flex flex-col overflow-y-auto">
          {/* 1. Active Quest Story Card */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#FADBD8]/40 via-[#FFF9F5] to-[#E8F8F5]/40 border-b-2 border-[#5C4033]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FCF3CF] magic-border-sm flex items-center justify-center text-2xl shadow-xs">
                  {activeQuest.npcAvatar.split(' ')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FADBD8] border border-[#F5B7B1] text-[#922B21]">
                      {lang === 'th' ? `องก์ที่ ${activeQuest.id}` : `Act ${activeQuest.id}`}
                    </span>
                    {isCurrentQuestCompleted ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4EFDF] text-[#1E8449] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> {lang === 'th' ? 'ภารกิจสำเร็จ!' : 'Completed!'}
                      </span>
                    ) : (
                      <span className="text-xs text-[#AF601A] font-medium">
                        {lang === 'th' ? 'กำลังดำเนินการ' : 'In Progress'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-[#5C4033] mt-0.5">
                    {questText.questTitle}
                  </h2>
                </div>
              </div>

              {/* Quest Act Switcher */}
              <div className="flex items-center gap-1">
                {QUESTS.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestIndex(idx)}
                    title={`${lang === 'th' ? 'องก์ที่' : 'Act'} ${idx + 1}: ${q.text[lang].questTitle}`}
                    className={`w-7 h-7 rounded-lg text-xs font-bold magic-border-sm transition-all cursor-pointer ${
                      currentQuestIndex === idx
                        ? 'bg-[#8E44AD] text-white scale-105'
                        : completedQuests.includes(q.id)
                        ? 'bg-[#D4EFDF] text-[#1E8449]'
                        : 'bg-white text-[#5C4033]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Quest Story Dialogue */}
            <div className="mt-3 p-3 bg-white/80 rounded-xl border border-[#5C4033]/20 text-xs text-[#5C4033] leading-relaxed">
              <p className="italic font-medium">"{questText.dialogue}"</p>
              <div className="mt-2 pt-2 border-t border-[#5C4033]/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[#16A085] font-bold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'th' ? 'เป้าหมาย: ' : 'Objective: '}
                    {questText.objective}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#8D6E63]">
                  <span>{lang === 'th' ? 'รางวัล:' : 'Reward:'} +{activeQuest.xpReward} XP</span>
                  <span>•</span>
                  <span>+{activeQuest.coinReward} {lang === 'th' ? 'เหรียญ' : 'Coins'}</span>
                </div>
              </div>
            </div>

            {/* Hint Accordion */}
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-[#AF601A] hover:text-[#7E4311] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  {showHint
                    ? (lang === 'th' ? 'ซ่อนคำใบ้' : 'Hide Hint')
                    : (lang === 'th' ? 'ต้องการคำใบ้สำหรับมนตร์ SQL หรือไม่?' : 'Need a hint for the SQL spell?')}
                </span>
              </button>

              {isCurrentQuestCompleted && currentQuestIndex < QUESTS.length - 1 && (
                <button
                  onClick={handleNextQuest}
                  className="px-3 py-1 rounded-xl bg-[#D4EFDF] hover:bg-[#A9DFBF] text-[#1E8449] font-bold text-xs magic-border-sm magic-border-pressed flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{lang === 'th' ? 'ไปยังองก์ถัดไป' : 'Next Act'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showHint && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#FCF3CF] border border-[#F9E79F] text-xs text-[#7D6608] flex items-center justify-between">
                <div>
                  <span className="font-bold">{lang === 'th' ? 'ม้วนคัมภีร์ปัญญา: ' : 'Scroll of Wisdom: '}</span>
                  <code className="font-mono bg-white/70 px-1.5 py-0.5 rounded text-[#5C4033]">
                    {questText.targetHint}
                  </code>
                </div>
                <button
                  onClick={() => insertTemplate(activeQuest.starterSql)}
                  className="px-2 py-0.5 rounded bg-white text-[#7D6608] font-bold text-[11px] border border-[#7D6608]/20 hover:bg-[#FFF9F5] cursor-pointer"
                >
                  {lang === 'th' ? 'คัดลอกใส่กล่อง' : 'Use Code'}
                </button>
              </div>
            )}
          </div>

          {/* 2. Tabs: SQL Console / Schema Browser / Spellbook */}
          <div className="flex-none px-4 pt-3 flex items-center gap-2 border-b border-[#5C4033]/20 bg-[#FFF9F5]">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-3 py-1.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'console'
                  ? 'bg-white border-t-2 border-l-2 border-r-2 border-[#5C4033] text-[#5C4033]'
                  : 'text-[#8D6E63] hover:text-[#5C4033]'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-[#8E44AD]" />
              <span>{lang === 'th' ? 'แท่นร่ายมนตร์ (Console)' : 'Cast Spell'}</span>
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-white border-t-2 border-l-2 border-r-2 border-[#5C4033] text-[#5C4033]'
                  : 'text-[#8D6E63] hover:text-[#5C4033]'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#2980B9]" />
              <span>{lang === 'th' ? 'ตารางข้อมูลในอาณาจักร (Schema)' : 'Realm Tables'}</span>
            </button>
            <button
              onClick={() => setActiveTab('spellbook')}
              className={`px-3 py-1.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'spellbook'
                  ? 'bg-white border-t-2 border-l-2 border-r-2 border-[#5C4033] text-[#5C4033]'
                  : 'text-[#8D6E63] hover:text-[#5C4033]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D35400]" />
              <span>{lang === 'th' ? 'ตำราเวทมนตร์ (Spellbook)' : 'Spellbook Help'}</span>
            </button>
          </div>

          {/* 3. Tab Contents */}
          <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-3">
            {/* TAB: SCHEMA INSPECTOR */}
            {activeTab === 'schema' && (
              <div className="p-3 bg-white rounded-2xl magic-border-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#8D6E63]">
                      {lang === 'th' ? 'เลือกตาราง:' : 'Choose Table:'}
                    </span>
                    {(['bakery_items', 'customers', 'spells'] as const).map(tbl => (
                      <button
                        key={tbl}
                        onClick={() => setActiveSchemaTable(tbl)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          activeSchemaTable === tbl
                            ? 'bg-[#D4E6F1] text-[#1B4F72] border border-[#2980B9]'
                            : 'bg-[#F2F4F4] text-[#5C4033] hover:bg-[#E5E7E9]'
                        }`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      insertTemplate(`SELECT * FROM ${activeSchemaTable};`);
                      setActiveTab('console');
                    }}
                    className="text-xs text-[#2980B9] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>SELECT *</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#E8F8F5] border-b border-[#5C4033]/20">
                        <th className="py-1.5 px-3 font-bold text-[#16A085]">
                          {lang === 'th' ? 'ชื่อคอลัมน์ (Column)' : 'Column Name'}
                        </th>
                        <th className="py-1.5 px-3 font-bold text-[#16A085]">
                          {lang === 'th' ? 'ประเภทข้อมูล (Type)' : 'Type'}
                        </th>
                        <th className="py-1.5 px-3 font-bold text-[#16A085]">
                          {lang === 'th' ? 'ตัวอย่างข้อมูล (Sample)' : 'Sample Value'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {activeSchemaTable === 'bakery_items' && (
                        <>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">id</td><td className="py-1 px-3 text-gray-500">INTEGER (PK)</td><td className="py-1 px-3 text-[#AF601A]">1</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">name</td><td className="py-1 px-3 text-gray-500">TEXT</td><td className="py-1 px-3 text-[#AF601A]">'Cloud Croissant'</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">category</td><td className="py-1 px-3 text-gray-500">TEXT</td><td className="py-1 px-3 text-[#AF601A]">'pastry'</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">price</td><td className="py-1 px-3 text-gray-500">INTEGER</td><td className="py-1 px-3 text-[#AF601A]">35</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">stock</td><td className="py-1 px-3 text-gray-500">INTEGER</td><td className="py-1 px-3 text-[#AF601A]">14</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">sweetness</td><td className="py-1 px-3 text-gray-500">INTEGER (1-5)</td><td className="py-1 px-3 text-[#AF601A]">4</td></tr>
                        </>
                      )}
                      {activeSchemaTable === 'customers' && (
                        <>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">id</td><td className="py-1 px-3 text-gray-500">INTEGER (PK)</td><td className="py-1 px-3 text-[#AF601A]">1</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">name</td><td className="py-1 px-3 text-gray-500">TEXT</td><td className="py-1 px-3 text-[#AF601A]">'Luna the Sprite'</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">species</td><td className="py-1 px-3 text-gray-500">TEXT</td><td className="py-1 px-3 text-[#AF601A]">'Fairy'</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">loyalty_tier</td><td className="py-1 px-3 text-gray-500">TEXT</td><td className="py-1 px-3 text-[#AF601A]">'Gold'</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">coins_spent</td><td className="py-1 px-3 text-gray-500">INTEGER</td><td className="py-1 px-3 text-[#AF601A]">420</td></tr>
                        </>
                      )}
                      {activeSchemaTable === 'spells' && (
                        <>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">id</td><td className="py-1 px-3 text-gray-500">INTEGER (PK)</td><td className="py-1 px-3 text-[#AF601A]">1</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">spell_name</td><td className="py-1 px-3 text-gray-500">TEXT</td><td className="py-1 px-3 text-[#AF601A]">'SELECT Sight'</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">mana_cost</td><td className="py-1 px-3 text-gray-500">INTEGER</td><td className="py-1 px-3 text-[#AF601A]">5</td></tr>
                          <tr><td className="py-1 px-3 text-[#5C4033] font-bold">element</td><td className="py-1 px-3 text-gray-500">TEXT</td><td className="py-1 px-3 text-[#AF601A]">'Light'</td></tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: SPELLBOOK HELP */}
            {activeTab === 'spellbook' && (
              <div className="p-3 bg-white rounded-2xl magic-border-sm flex flex-col gap-3">
                <h3 className="text-xs font-bold text-[#8E44AD] flex items-center gap-1.5 uppercase tracking-wide">
                  <BookOpen className="w-4 h-4" />
                  <span>{lang === 'th' ? 'สารบัญคาถา SQL แห่งอาณาจักร' : 'The Grand Relational Spellbook'}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#E8F8F5] border border-[#A2D9CE]">
                    <div className="font-bold text-[#16A085]">SELECT * FROM table;</div>
                    <p className="text-[#5C4033] text-[11px] mt-0.5">
                      {lang === 'th' ? 'เรียกดูคอลัมน์และแถวข้อมูลทั้งหมดจากตาราง' : 'Summons all columns and all records from a table.'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FADBD8] border border-[#F5B7B1]">
                    <div className="font-bold text-[#922B21]">WHERE column &lt; value</div>
                    <p className="text-[#5C4033] text-[11px] mt-0.5">
                      {lang === 'th' ? 'คัดกรองเฉพาะแถวข้อมูลที่ตรงตามเงื่อนไขที่กำหนด' : 'Filters rows to only those that fulfill the condition.'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FCF3CF] border border-[#F9E79F]">
                    <div className="font-bold text-[#7D6608]">WHERE category = 'berry'</div>
                    <p className="text-[#5C4033] text-[11px] mt-0.5">
                      {lang === 'th' ? 'เปรียบเทียบข้อความที่ตรงกันเป๊ะโดยใส่เครื่องหมายคำพูดเดี่ยว' : 'Match exact string literals using single quotes.'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#D4E6F1] border border-[#A9CCE3]">
                    <div className="font-bold text-[#1B4F72]">ORDER BY col DESC</div>
                    <p className="text-[#5C4033] text-[11px] mt-0.5">
                      {lang === 'th' ? 'เรียงลำดับข้อมูลจากมากไปหาน้อย (DESC) หรือน้อยไปมาก (ASC)' : 'Sorts records from largest to smallest.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SQL EDITOR / CONSOLE */}
            <div className="flex flex-col gap-2">
              {/* Quick Syntax Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#8D6E63] mr-1">
                  {lang === 'th' ? 'คริสตัลทางลัด:' : 'Runic Chips:'}
                </span>
                <button
                  onClick={() => insertTemplate('SELECT * FROM bakery_items;')}
                  className="px-2 py-0.5 rounded-md bg-[#FFF9F5] border border-[#5C4033]/30 text-[11px] font-mono hover:bg-[#FADBD8] cursor-pointer"
                >
                  * FROM bakery_items
                </button>
                <button
                  onClick={() => insertTemplate('SELECT * FROM bakery_items WHERE price < 50;')}
                  className="px-2 py-0.5 rounded-md bg-[#FFF9F5] border border-[#5C4033]/30 text-[11px] font-mono hover:bg-[#FADBD8] cursor-pointer"
                >
                  WHERE price &lt; 50
                </button>
                <button
                  onClick={() => insertTemplate("SELECT * FROM bakery_items WHERE category = 'berry';")}
                  className="px-2 py-0.5 rounded-md bg-[#FFF9F5] border border-[#5C4033]/30 text-[11px] font-mono hover:bg-[#FADBD8] cursor-pointer"
                >
                  WHERE category = 'berry'
                </button>
                <button
                  onClick={() => insertTemplate('SELECT * FROM bakery_items ORDER BY stock DESC;')}
                  className="px-2 py-0.5 rounded-md bg-[#FFF9F5] border border-[#5C4033]/30 text-[11px] font-mono hover:bg-[#FADBD8] cursor-pointer"
                >
                  ORDER BY stock DESC
                </button>
              </div>

              {/* Textarea Editor Box */}
              <div className="relative bg-white rounded-2xl magic-border-sm focus-within:ring-2 focus-within:ring-[#8E44AD] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#FFF9F5] border-b border-[#5C4033]/20 flex items-center justify-between text-xs text-[#8D6E63]">
                  <span className="font-mono font-bold flex items-center gap-1.5 text-[#5C4033]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E74C3C] inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F1C40F] inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] inline-block" />
                    <span className="ml-2 font-prompt text-[11px]">
                      {lang === 'th' ? 'กระดาษจดคาถา spell.sql' : 'spell_input.sql'}
                    </span>
                  </span>
                  <span className="text-[11px]">
                    {lang === 'th' ? 'กด' : 'Press'} <kbd className="font-mono bg-white px-1 border rounded">Ctrl+Enter</kbd> {lang === 'th' ? 'เพื่อร่ายมนตร์' : 'to cast'}
                  </span>
                </div>

                <textarea
                  value={sqlQuery}
                  onChange={e => setSqlQuery(e.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  placeholder={
                    lang === 'th'
                      ? 'เขียนคำสั่งมนตร์ SQL ที่นี่... เช่น SELECT * FROM bakery_items WHERE price < 50;'
                      : 'Cast your SQL spell here... e.g. SELECT * FROM bakery_items WHERE price < 50;'
                  }
                  rows={3}
                  className="w-full p-3 font-mono text-xs sm:text-sm text-[#5C4033] bg-transparent outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Action Buttons: Cast Spell / Clear */}
              <div className="flex items-center justify-between gap-2 mt-1">
                <button
                  onClick={() => setSqlQuery('')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-[#5C4033]/30 text-xs text-[#5C4033] flex items-center gap-1.5 cursor-pointer font-prompt"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'th' ? 'ล้างคำสั่ง' : 'Clear'}</span>
                </button>

                <button
                  onClick={handleCastSpell}
                  className="px-5 py-2.5 rounded-xl bg-[#8E44AD] hover:bg-[#7D3C98] text-white font-bold text-xs sm:text-sm magic-border-sm magic-border-pressed flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 font-prompt"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{lang === 'th' ? 'ร่ายมนตร์ SQL! ✨' : 'Cast SQL Spell! ✨'}</span>
                </button>
              </div>
            </div>

            {/* 4. Query Results Output Area */}
            <div className="mt-2 flex-1 flex flex-col min-h-[160px]">
              {queryResult ? (
                queryResult.success ? (
                  <div className="bg-white rounded-2xl magic-border-sm p-3 flex flex-col flex-1 overflow-hidden">
                    {/* Status Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#5C4033]/15">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#27AE60]" />
                        <span className="text-xs font-bold text-[#27AE60]">
                          {lang === 'th' ? 'ร่ายมนตร์สำเร็จ!' : 'Spell Succeeded!'}
                        </span>
                        <span className="text-[11px] text-[#8D6E63]">
                          ({queryResult.rowCount} {lang === 'th' ? 'แถว' : 'rows'} • {queryResult.executionTimeMs} ms)
                        </span>
                      </div>

                      {/* Quest Completion Banner */}
                      {isCurrentQuestCompleted && (
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FCF3CF] text-[#7D6608] text-[11px] font-bold border border-[#F9E79F]">
                          <Award className="w-3.5 h-3.5 text-[#D4AC0D]" />
                          <span>{lang === 'th' ? 'ผ่านเงื่อนไขภารกิจ! 🎉' : 'Goal Met! 🎉'}</span>
                        </div>
                      )}
                    </div>

                    {/* Result Table */}
                    {queryResult.rows.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#8D6E63] italic">
                        {lang === 'th'
                          ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข WHERE ในคำสั่งนี้'
                          : '0 rows matched your WHERE spell condition.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#E8F8F5] border-b-2 border-[#5C4033]/20">
                              {queryResult.columns.map(col => (
                                <th
                                  key={col}
                                  className="py-1.5 px-3 font-bold text-[#16A085] uppercase tracking-wider text-[11px]"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-mono">
                            {queryResult.rows.map((row, idx) => (
                              <tr
                                key={idx}
                                className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F5]/70 hover:bg-[#FADBD8]/20'}
                              >
                                {queryResult.columns.map(col => (
                                  <td key={col} className="py-1.5 px-3 text-[#5C4033]">
                                    {row[col] !== null && row[col] !== undefined
                                      ? String(row[col])
                                      : 'NULL'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Error Alert */
                  <div className="bg-[#FADBD8]/40 border-2 border-[#E74C3C] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#922B21]">
                    <AlertCircle className="w-5 h-5 flex-none text-[#E74C3C]" />
                    <div>
                      <div className="font-bold text-sm mb-1">
                        {lang === 'th' ? 'มนตร์เกิดสะดุด!' : 'Spell Fizzled!'}
                      </div>
                      <p className="leading-relaxed">{queryResult.errorMessage}</p>
                      <p className="mt-2 text-[11px] text-[#5C4033]">
                        {lang === 'th'
                          ? 'คำแนะนำ: ตรวจสอบการสะกดชื่อตารางและชื่อคอลัมน์ หรือคลิกแท็บตารางข้อมูลด้านบน'
                          : 'Hint: Check spelling of tables and columns, or consult the Schema tab above.'}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                /* Empty state prompt */
                <div className="flex-1 rounded-2xl border-2 border-dashed border-[#5C4033]/20 p-6 flex flex-col items-center justify-center text-center text-[#8D6E63]">
                  <Wand2 className="w-8 h-8 text-[#BB8FCE] mb-2 stroke-[1.5]" />
                  <p className="text-xs font-medium">
                    {lang === 'th' ? 'แท่นร่ายมนตร์พร้อมใช้งาน!' : 'Ready to cast!'}
                  </p>
                  <p className="text-[11px] text-[#8D6E63]/80 mt-1 max-w-xs">
                    {lang === 'th'
                      ? 'พิมพ์คำสั่ง SQL ด้านบนแล้วกดปุ่ม "ร่ายมนตร์ SQL!" เพื่อดูผลลัพธ์ข้อมูล'
                      : 'Type your SQL query above and click "Cast SQL Spell" to inspect results.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ---------------------------------------------------- */}
      {/* BOTTOM STATUS BAR                                    */}
      {/* ---------------------------------------------------- */}
      <footer className="flex-none bg-[#FFF9F5] border-t-2 border-[#5C4033] px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-[#8D6E63] z-20 font-prompt">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#16A085]" />
            <span>
              {lang === 'th' ? 'เหรียญตราที่ปลดล็อก:' : 'Badges Unlocked:'} {unlockedBadges.length} / {QUESTS.length}
            </span>
          </span>
          {unlockedBadges.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {unlockedBadges.map((b, i) => (
                <span key={i} className="text-sm" title={b}>
                  {b.split(' ').pop()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>🎮 {lang === 'th' ? 'เดิน: WASD / ปุ่มลูกศร' : 'Move: WASD / Arrow Keys'}</span>
          <span>•</span>
          <span>✨ {lang === 'th' ? 'คุยกับแมว: คลิกที่ตัวแมว หรือกด Space' : 'Click Cat or Space to talk'}</span>
        </div>
      </footer>
    </div>
  );
}
