/**
 * 规则引擎测试
 * 验证掷骰系统、检定系统的正确性
 */

import RuleEngine from '../RuleEngine.js';

// 简单的测试框架
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   ${error.message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(`${message}: expected true, got ${value}`);
  }
}

function assertFalse(value, message) {
  if (value) {
    throw new Error(`${message}: expected false, got ${value}`);
  }
}

// 创建规则引擎实例
const engine = new RuleEngine();

console.log('=== 规则引擎测试 ===\n');

// 测试掷骰系统
test('DiceRoller: 解析 d20', () => {
  const result = engine.roll('d20');
  assertTrue(result.rawRolls.length === 1, '应该掷1个骰子');
  assertTrue(result.rawRolls[0] >= 1 && result.rawRolls[0] <= 20, '结果应该在1-20之间');
  assertEqual(result.total, result.rawRolls[0], '总和应该等于骰子结果');
});

test('DiceRoller: 解析 2d6+3', () => {
  const result = engine.roll('2d6+3');
  assertTrue(result.rawRolls.length === 2, '应该掷2个骰子');
  assertTrue(result.total >= 2 && result.total <= 12, '骰子总和应该在2-12之间');
  assertEqual(result.finalValue, result.total + 3, '最终值应该包含修正值');
});

test('DiceRoller: 解析 1d100', () => {
  const result = engine.roll('1d100');
  assertTrue(result.rawRolls.length === 1, '应该掷1个骰子');
  assertTrue(result.rawRolls[0] >= 1 && result.rawRolls[0] <= 100, '结果应该在1-100之间');
});

// 测试检定系统
test('CheckEngine: 攻击检定命中', () => {
  // 模拟一个高攻击加值，确保命中
  const result = engine.attackCheck({
    attackBonus: 20,
    targetAC: 10
  });
  assertTrue(result.isSuccess, '应该命中');
  assertEqual(result.checkType, 'attack', '检定类型应该是攻击');
});

test('CheckEngine: 攻击检定未命中', () => {
  // 模拟一个低攻击加值，确保未命中
  const result = engine.attackCheck({
    attackBonus: -20,
    targetAC: 30
  });
  assertFalse(result.isSuccess, '应该未命中');
});

test('CheckEngine: 技能检定', () => {
  const result = engine.skillCheck({
    skillBonus: 5,
    dc: 10
  });
  assertEqual(result.checkType, 'skill', '检定类型应该是技能');
  assertTrue(result.finalValue >= 6 && result.finalValue <= 25, '最终值应该在合理范围内');
});

test('CheckEngine: 豁免检定', () => {
  const result = engine.savingThrow({
    saveBonus: 3,
    spellDC: 15
  });
  assertEqual(result.checkType, 'saving_throw', '检定类型应该是豁免');
});

// 测试属性计算
test('RuleEngine: 计算属性修正值', () => {
  assertEqual(engine.calculateAbilityModifier(10), 0, '10点属性修正应该是0');
  assertEqual(engine.calculateAbilityModifier(12), 1, '12点属性修正应该是1');
  assertEqual(engine.calculateAbilityModifier(15), 2, '15点属性修正应该是2');
  assertEqual(engine.calculateAbilityModifier(8), -1, '8点属性修正应该是-1');
});

test('RuleEngine: 计算熟练加值', () => {
  assertEqual(engine.calculateProficiencyBonus(1), 2, '1级熟练加值应该是2');
  assertEqual(engine.calculateProficiencyBonus(5), 3, '5级熟练加值应该是3');
  assertEqual(engine.calculateProficiencyBonus(9), 3, '9级熟练加值应该是3');
  assertEqual(engine.calculateProficiencyBonus(13), 4, '13级熟练加值应该是4');
});

// 测试AI请求处理
test('RuleEngine: 处理AI请求 - 掷骰', () => {
  const result = engine.processAIRequest({
    type: 'roll',
    params: { notation: 'd20' }
  });
  assertTrue(result.rawRolls.length === 1, '应该返回掷骰结果');
});

test('RuleEngine: 处理AI请求 - 属性修正', () => {
  const result = engine.processAIRequest({
    type: 'ability_modifier',
    params: { abilityScore: 16 }
  });
  assertEqual(result.value, 16, '应该返回属性值');
  assertEqual(result.modifier, 3, '16点属性修正应该是3');
});

console.log('\n=== 测试完成 ===');
