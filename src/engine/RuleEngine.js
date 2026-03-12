/**
 * 规则引擎主入口
 * 整合掷骰系统、检定系统，提供统一的规则计算接口
 * 基于《判定系统设计规范》和《框架说明》实现
 */

import DiceRoller from './DiceRoller.js';
import CheckEngine from './CheckEngine.js';

class RuleEngine {
  constructor() {
    this.diceRoller = new DiceRoller();
    this.checkEngine = new CheckEngine();
  }

  // ==================== 掷骰接口 ====================

  /**
   * 掷骰子
   * @param {string} notation - 骰子表达式，如 "2d6+3"
   * @returns {Object} 掷骰结果
   */
  roll(notation) {
    return this.diceRoller.roll(notation);
  }

  /**
   * 带优势掷骰
   * @param {string} notation - 骰子表达式
   * @returns {Object} 掷骰结果
   */
  rollWithAdvantage(notation) {
    return this.diceRoller.rollWithAdvantage(notation);
  }

  /**
   * 带劣势掷骰
   * @param {string} notation - 骰子表达式
   * @returns {Object} 掷骰结果
   */
  rollWithDisadvantage(notation) {
    return this.diceRoller.rollWithDisadvantage(notation);
  }

  // ==================== 检定接口 ====================

  /**
   * 通用检定
   * @param {Object} params - 检定参数
   * @returns {Object} 检定结果
   */
  check(params) {
    return this.checkEngine.check(params);
  }

  /**
   * 攻击检定
   * @param {Object} params - 攻击参数
   * @returns {Object} 检定结果
   */
  attackCheck(params) {
    return this.checkEngine.attackCheck(params);
  }

  /**
   * 技能检定
   * @param {Object} params - 技能检定参数
   * @returns {Object} 检定结果
   */
  skillCheck(params) {
    return this.checkEngine.skillCheck(params);
  }

  /**
   * 豁免检定
   * @param {Object} params - 豁免检定参数
   * @returns {Object} 检定结果
   */
  savingThrow(params) {
    return this.checkEngine.savingThrow(params);
  }

  /**
   * 计算伤害
   * @param {Object} params - 伤害参数
   * @returns {Object} 伤害结果
   */
  calculateDamage(params) {
    return this.checkEngine.calculateDamage(params);
  }

  // ==================== 属性计算接口 ====================

  /**
   * 计算属性修正值（DND5E标准）
   * @param {number} abilityScore - 属性值（如力量15）
   * @returns {number} 属性修正值
   */
  calculateAbilityModifier(abilityScore) {
    return Math.floor((abilityScore - 10) / 2);
  }

  /**
   * 计算熟练加值（DND5E标准）
   * @param {number} level - 角色等级
   * @returns {number} 熟练加值
   */
  calculateProficiencyBonus(level) {
    return Math.floor((level - 1) / 4) + 2;
  }

  /**
   * 计算技能加值
   * @param {number} abilityModifier - 属性修正
   * @param {number} proficiencyBonus - 熟练加值（如果熟练）
   * @param {boolean} isProficient - 是否熟练
   * @returns {number} 技能加值
   */
  calculateSkillBonus(abilityModifier, proficiencyBonus = 0, isProficient = false) {
    return abilityModifier + (isProficient ? proficiencyBonus : 0);
  }

  // ==================== 战斗接口 ====================

  /**
   * 执行完整攻击流程
   * @param {Object} params - 攻击参数
   * @param {number} params.attackBonus - 攻击加值
   * @param {number} params.targetAC - 目标AC
   * @param {string} params.damageDice - 伤害骰
   * @param {number} params.damageModifier - 伤害修正
   * @param {boolean} params.advantage - 是否有优势
   * @param {boolean} params.disadvantage - 是否有劣势
   * @returns {Object} 完整攻击结果
   */
  executeAttack({
    attackBonus = 0,
    targetAC = 10,
    damageDice = '1d6',
    damageModifier = 0,
    advantage = false,
    disadvantage = false
  }) {
    // 1. 攻击检定
    const attackResult = this.attackCheck({
      attackBonus,
      targetAC,
      advantage,
      disadvantage
    });

    // 2. 如果命中，计算伤害
    let damageResult = null;
    if (attackResult.isSuccess) {
      damageResult = this.calculateDamage({
        damageDice,
        abilityModifier: damageModifier
      });
    }

    return {
      attack: attackResult,
      damage: damageResult,
      hit: attackResult.isSuccess,
      totalDamage: damageResult ? damageResult.totalDamage : 0
    };
  }

  // ==================== AI DM 交互接口 ====================

  /**
   * 处理AI DM的规则请求
   * 这是AI DM与规则引擎的主要交互接口
   * @param {Object} request - AI DM的请求
   * @returns {Object} 规则计算结果
   */
  processAIRequest(request) {
    const { type, params } = request;

    switch (type) {
      case 'roll':
        return this.roll(params.notation);
      
      case 'check':
        return this.check(params);
      
      case 'attack':
        return this.attackCheck(params);
      
      case 'skill':
        return this.skillCheck(params);
      
      case 'saving_throw':
        return this.savingThrow(params);
      
      case 'damage':
        return this.calculateDamage(params);
      
      case 'ability_modifier':
        return { 
          value: params.abilityScore,
          modifier: this.calculateAbilityModifier(params.abilityScore) 
        };
      
      case 'proficiency_bonus':
        return {
          level: params.level,
          bonus: this.calculateProficiencyBonus(params.level)
        };
      
      case 'full_attack':
        return this.executeAttack(params);
      
      default:
        throw new Error(`Unknown request type: ${type}`);
    }
  }
}

export default RuleEngine;
