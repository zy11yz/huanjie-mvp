/**
 * 检定系统 - 基于《判定系统设计规范》实现
 * 处理所有判定逻辑：攻击、技能、豁免等
 */

import DiceRoller from './DiceRoller.js';

class CheckEngine {
  constructor() {
    this.diceRoller = new DiceRoller();
  }

  /**
   * 执行检定
   * @param {Object} params - 检定参数
   * @param {string} params.diceNotation - 骰子表达式（必填）
   * @param {number} params.baseValue - 基础数值（如角色力量值）
   * @param {number} params.modifier - 临时修正（如地形加成）
   * @param {number} params.threshold - 成功阈值（DC值）
   * @param {boolean} params.advantage - 是否有优势
   * @param {boolean} params.disadvantage - 是否有劣势
   * @returns {Object} 检定结果
   */
  check({
    diceNotation = 'd20',
    baseValue = 0,
    modifier = 0,
    threshold = null,
    advantage = false,
    disadvantage = false
  }) {
    // 掷骰
    let rollResult;
    if (advantage && !disadvantage) {
      rollResult = this.diceRoller.rollWithAdvantage(diceNotation);
    } else if (disadvantage && !advantage) {
      rollResult = this.diceRoller.rollWithDisadvantage(diceNotation);
    } else {
      rollResult = this.diceRoller.roll(diceNotation);
    }

    // 计算最终值
    const finalValue = rollResult.finalValue + baseValue + modifier;

    // 判断是否成功
    let isSuccess = null;
    let successType = null;
    
    if (threshold !== null) {
      isSuccess = finalValue >= threshold;
      
      // 判定成功类型（DND5E规则）
      if (isSuccess) {
        if (finalValue >= threshold + 10) {
          successType = 'critical_success';
        } else {
          successType = 'success';
        }
      } else {
        if (finalValue <= threshold - 10) {
          successType = 'critical_failure';
        } else {
          successType = 'failure';
        }
      }
    }

    return {
      rawRolls: rollResult.rawRolls,
      total: rollResult.total,
      baseValue,
      modifier,
      finalValue,
      threshold,
      isSuccess,
      successType,
      advantage: rollResult.advantage || false,
      disadvantage: rollResult.disadvantage || false,
      discardedRoll: rollResult.discardedRoll || null
    };
  }

  /**
   * 攻击检定
   * @param {Object} params - 攻击参数
   * @param {number} params.attackBonus - 攻击加值
   * @param {number} params.targetAC - 目标AC
   * @param {boolean} params.advantage - 是否有优势
   * @param {boolean} params.disadvantage - 是否有劣势
   * @returns {Object} 检定结果
   */
  attackCheck({ attackBonus = 0, targetAC = 10, advantage = false, disadvantage = false }) {
    const result = this.check({
      diceNotation: 'd20',
      baseValue: attackBonus,
      threshold: targetAC,
      advantage,
      disadvantage
    });

    return {
      ...result,
      checkType: 'attack',
      attackBonus,
      targetAC
    };
  }

  /**
   * 技能检定
   * @param {Object} params - 技能检定参数
   * @param {number} params.skillBonus - 技能加值（属性修正 + 熟练加值）
   * @param {number} params.dc - 难度等级
   * @param {boolean} params.advantage - 是否有优势
   * @param {boolean} params.disadvantage - 是否有劣势
   * @returns {Object} 检定结果
   */
  skillCheck({ skillBonus = 0, dc = 10, advantage = false, disadvantage = false }) {
    const result = this.check({
      diceNotation: 'd20',
      baseValue: skillBonus,
      threshold: dc,
      advantage,
      disadvantage
    });

    return {
      ...result,
      checkType: 'skill',
      skillBonus,
      dc
    };
  }

  /**
   * 豁免检定
   * @param {Object} params - 豁免检定参数
   * @param {number} params.saveBonus - 豁免加值
   * @param {number} params.spellDC - 法术DC
   * @param {boolean} params.advantage - 是否有优势
   * @param {boolean} params.disadvantage - 是否有劣势
   * @returns {Object} 检定结果
   */
  savingThrow({ saveBonus = 0, spellDC = 10, advantage = false, disadvantage = false }) {
    const result = this.check({
      diceNotation: 'd20',
      baseValue: saveBonus,
      threshold: spellDC,
      advantage,
      disadvantage
    });

    return {
      ...result,
      checkType: 'saving_throw',
      saveBonus,
      spellDC
    };
  }

  /**
   * 伤害计算
   * @param {Object} params - 伤害参数
   * @param {string} params.damageDice - 伤害骰表达式，如 "2d6"
   * @param {number} params.abilityModifier - 属性修正
   * @returns {Object} 伤害结果
   */
  calculateDamage({ damageDice = '1d6', abilityModifier = 0 }) {
    const rollResult = this.diceRoller.roll(damageDice);
    const totalDamage = rollResult.finalValue + abilityModifier;

    return {
      damageDice,
      rawRolls: rollResult.rawRolls,
      diceTotal: rollResult.total,
      abilityModifier,
      totalDamage: Math.max(0, totalDamage) // 伤害不能为负
    };
  }
}

export default CheckEngine;
