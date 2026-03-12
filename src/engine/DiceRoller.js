/**
 * 掷骰系统 - 基于《判定系统设计规范》实现
 * 支持 TRPG 常见骰子类型（d4/d6/d8/d10/d12/d20/d100）
 */

class DiceRoller {
  constructor() {
    this.supportedDice = [4, 6, 8, 10, 12, 20, 100];
  }

  /**
   * 解析骰子表达式
   * @param {string} notation - 骰子表达式，如 "2d6+3", "d20", "1d100"
   * @returns {Object} 解析结果 {count, sides, modifier}
   */
  parseNotation(notation) {
    const regex = /^(\d*)d(\d+)(?:([+-])(\d+))?$/i;
    const match = notation.trim().toLowerCase().match(regex);
    
    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }

    const count = match[1] ? parseInt(match[1], 10) : 1;
    const sides = parseInt(match[2], 10);
    const modifierSign = match[3] || '+';
    const modifierValue = match[4] ? parseInt(match[4], 10) : 0;
    const modifier = modifierSign === '-' ? -modifierValue : modifierValue;

    if (count < 1 || count > 100) {
      throw new Error(`Dice count must be between 1 and 100, got: ${count}`);
    }

    if (!this.supportedDice.includes(sides)) {
      throw new Error(`Unsupported dice type: d${sides}. Supported: ${this.supportedDice.join(', ')}`);
    }

    return { count, sides, modifier };
  }

  /**
   * 掷单个骰子
   * @param {number} sides - 骰子面数
   * @returns {number} 1 到 sides 的随机整数
   */
  rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * 掷骰子
   * @param {string} notation - 骰子表达式，如 "2d6+3"
   * @returns {Object} 掷骰结果
   */
  roll(notation) {
    const { count, sides, modifier } = this.parseNotation(notation);
    
    const rawRolls = [];
    for (let i = 0; i < count; i++) {
      rawRolls.push(this.rollDie(sides));
    }

    const total = rawRolls.reduce((sum, roll) => sum + roll, 0);
    const finalValue = total + modifier;

    return {
      notation,
      rawRolls,
      total,
      modifier,
      finalValue
    };
  }

  /**
   * 带优势的掷骰（掷两次，取较高值）
   * @param {string} notation - 骰子表达式
   * @returns {Object} 掷骰结果
   */
  rollWithAdvantage(notation) {
    const roll1 = this.roll(notation);
    const roll2 = this.roll(notation);
    
    const bestRoll = roll1.finalValue >= roll2.finalValue ? roll1 : roll2;
    
    return {
      ...bestRoll,
      advantage: true,
      rolls: [roll1, roll2],
      discardedRoll: roll1.finalValue >= roll2.finalValue ? roll2 : roll1
    };
  }

  /**
   * 带劣势的掷骰（掷两次，取较低值）
   * @param {string} notation - 骰子表达式
   * @returns {Object} 掷骰结果
   */
  rollWithDisadvantage(notation) {
    const roll1 = this.roll(notation);
    const roll2 = this.roll(notation);
    
    const worstRoll = roll1.finalValue <= roll2.finalValue ? roll1 : roll2;
    
    return {
      ...worstRoll,
      disadvantage: true,
      rolls: [roll1, roll2],
      discardedRoll: roll1.finalValue <= roll2.finalValue ? roll2 : roll1
    };
  }
}

export default DiceRoller;
