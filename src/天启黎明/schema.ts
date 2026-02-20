export const Schema = z
  .object({
    界面: z
      .object({
        建卡: z
          .object({
            已开始: z.boolean().prefault(false),
            角色姓名: z.string().prefault(''),
            职业: z.enum(['指挥官', '战姬', '权柄使役者']).prefault('指挥官'),
            战姬类型: z
              .enum(['侦察型', '轻型', '中型', '重型', '要塞型', '地面支援姬'])
              .prefault('轻型'),
            年龄: z.coerce.number().transform(v => _.clamp(v, 12, 80)).prefault(21),
            性别: z.enum(['男性', '女性']).prefault('男性'),
            作弊模式: z.boolean().prefault(false),
            剧情模式: z.boolean().prefault(false),
          })
          .prefault({}),
        楼层文本: z
          .object({
            正文: z.string().prefault(''),
            原文: z.string().prefault(''),
            更新时间: z.coerce.number().prefault(0),
          })
          .prefault({}),
        在场角色: z
          .array(
            z
              .object({
                姓名: z.string().prefault('未命名'),
                好感度: z.coerce.number().transform(v => _.clamp(v, -200, 1000)).prefault(0),
                态度: z.string().prefault('中立'),
                内心想法: z.string().prefault(''),
                基础属性: z.record(z.string().describe('属性名'), z.coerce.number().prefault(0)).prefault({}),
                更新时间: z.coerce.number().prefault(0),
              })
              .prefault({}),
          )
          .prefault([]),
        模块折叠: z
          .object({
            在场角色: z.boolean().prefault(false),
            长期NPC: z.boolean().prefault(false),
          })
          .prefault({}),
        游戏结束: z
          .object({
            已结束: z.boolean().prefault(false),
            原因: z.string().prefault(''),
            时间戳: z.coerce.number().prefault(0),
          })
          .prefault({}),
        空战反馈: z
          .object({
            待反馈: z.boolean().prefault(false),
            摘要: z.string().prefault(''),
            时间戳: z.coerce.number().prefault(0),
          })
          .prefault({}),
      })
      .prefault({}),

    世界: z
      .object({
        当前时间: z.string().prefault('联合纪年177年8月28日 08:00'),
        当前地点: z.string().prefault('联合第六集团军 卡尔斯空港城'),
        天气: z.string().prefault('阴，低能见度'),
        战区威胁等级: z.enum(['低', '中', '高', '极危']).prefault('中'),
        近期事务: z.record(z.string().describe('事务名'), z.string().describe('事务描述')).prefault({}),
        新手引导: z
          .object({
            剧情模式: z.boolean().prefault(false),
            训练判定: z.enum(['未受训', '已受训']).prefault('未受训'),
            阶段: z.enum(['入学手续', '课程周', '希尔顿试验室任务', '自由推进']).prefault('入学手续'),
            入学手续进度: z.coerce.number().transform(v => _.clamp(v, 0, 4)).prefault(0),
            课程周进度: z.coerce.number().transform(v => _.clamp(v, 0, 7)).prefault(0),
            已完成入学手续: z.boolean().prefault(false),
            已完成课程周: z.boolean().prefault(false),
            已接希尔顿任务: z.boolean().prefault(false),
            最后推进说明: z.string().prefault(''),
          })
          .prefault({}),
        长期NPC列表: z.record(
          z.string().describe('NPC姓名'),
          z.object({
            姓名: z.string().prefault('未命名'),
            好感度: z.coerce.number().transform(v => _.clamp(v, -200, 1000)).prefault(0),
            好感阶段: z.enum(['死敌', '危险', '警惕', '熟悉', '朋友', '挚友', '亲密', '伴侣']).prefault('警惕'),
            态度: z.string().prefault('中立'),
            内心想法: z.string().prefault(''),
            基础属性: z.record(z.string().describe('属性名'), z.coerce.number().prefault(0)).prefault({}),
            性行为次数: z.coerce.number().transform(v => _.clamp(v, 0, 99999)).prefault(0),
            贞洁状态: z.enum(['处女', '非处女']).prefault('处女'),
            关系标签: z.array(z.string()).prefault([]),
            首次记录时间: z.coerce.number().prefault(0),
            最后更新时间: z.coerce.number().prefault(0),
          }).prefault({}),
        ).prefault({}),
        NPC关系追踪: z.record(
          z.string().describe('NPC姓名'),
          z.object({
            连续出现计数: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(0),
            最近出现轮次: z.coerce.number().transform(v => _.clamp(v, 0, 999999)).prefault(0),
            玩家随行请求命中次数: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(0),
            最近玩家请求时间: z.coerce.number().prefault(0),
            是否已转长期: z.boolean().prefault(false),
          }).prefault({}),
        ).prefault({}),
      })
      .prefault({}),

    主角: z
      .object({
        档案: z
          .object({
            代号: z.string().prefault('待命战姬'),
            阵营: z.string().prefault('战姬武装部'),
            职阶: z.string().prefault('预备役'),
            身份路径: z.string().prefault('轻型战姬'),
          })
          .prefault({}),

        人类属性: z
          .object({
            力量: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(1),
            敏捷: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(1),
            体质: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(1),
            感知: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(1),
            意志: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(1),
            魅力: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(1),
            学识: z.coerce.number().transform(v => _.clamp(v, 0, 5)).prefault(1),
          })
          .prefault({}),

        锻炼: z
          .object({
            力量: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
            敏捷: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
            体质: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
            感知: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
            意志: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
            魅力: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
            学识: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
          })
          .prefault({}),

        属性: z
          .object({
            魔力评级: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(20),
            力量加成: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(18),
            体质加成: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(18),
            抗污染值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(18),
            飞行速度: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(20),
            防御评级: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(12),
          })
          .prefault({}),

        成长: z
          .object({
            战姬老练等级: z.coerce.number().transform(v => _.clamp(v, 1, 20)).prefault(1),
            权柄使役者等级: z.coerce.number().transform(v => _.clamp(v, 1, 20)).prefault(1),
            魔力碎片: z.coerce.number().transform(v => _.clamp(v, 0, 999999)).prefault(0),
            下一级所需魔力碎片: z.coerce.number().transform(v => _.clamp(v, 0, 999999)).prefault(10),
            权柄碎片: z.coerce.number().transform(v => _.clamp(v, 0, 999999)).prefault(0),
            权柄本源: z.boolean().prefault(false),
          })
          .prefault({}),

        灵装化: z
          .object({
            启用: z.boolean().prefault(false),
            手动切换: z.boolean().prefault(false),
            灵装模式: z.enum(['待机', '标准', '过载']).prefault('标准'),
            每回合耗魔: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(8),
            每回合耗槽: z.coerce.number().transform(v => _.clamp(v, 0, 9)).prefault(1),
            上次结算轮次: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(0),
          })
          .prefault({}),

        资源: z
          .object({
            当前生命: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(100),
            最大生命: z.coerce.number().transform(v => _.clamp(v, 1, 9999)).prefault(100),
            当前魔力: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(100),
            最大魔力: z.coerce.number().transform(v => _.clamp(v, 1, 9999)).prefault(100),
            污染值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
            行动点: z.coerce.number().transform(v => _.clamp(v, 0, 9)).prefault(1),
            移动点: z.coerce.number().transform(v => _.clamp(v, 0, 9)).prefault(1),
            灵装槽当前: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(10),
            灵装槽上限: z.coerce.number().transform(v => _.clamp(v, 1, 99)).prefault(10),
          })
          .prefault({}),

        基础能力: z
          .object({
            已选: z.array(z.string()).prefault([]),
          })
          .prefault({}),
        技能树: z
          .object({
            可用技能点: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(4),
            已用技能点: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            已解锁: z.record(z.string().describe('节点ID'), z.boolean()).prefault({}),
            自定义: z.string().prefault(''),
          })
          .prefault({}),
        权柄: z
          .object({
            权柄名称: z.string().prefault(''),
            权柄途径: z.enum(['生命', '历史', '群星', '黎明', '黑夜', '力量', '希望', '勇气', '梦想']).prefault('生命'),
            碎片数: z.coerce.number().transform(v => _.clamp(v, 0, 99999)).prefault(0),
            赋予技能: z.string().prefault(''),
            审核通过: z.boolean().prefault(false),
            审核备注: z.string().prefault(''),
          })
          .prefault({}),
        背景: z
          .object({
            原文: z.string().prefault(''),
            摘要: z.string().prefault(''),
          })
          .prefault({}),

        战术: z
          .object({
            战斗模式: z.enum(['非战斗', '空战', '地面战']).prefault('非战斗'),
            是否战斗中: z.boolean().prefault(false),
            当前阵线: z.enum(['后卫', '中线', '前线', '交锋区']).prefault('中线'),
            制空权: z.enum(['我方', '敌方', '争夺中']).prefault('争夺中'),
            当前轮次: z.coerce.number().transform(v => _.clamp(v, 1, 999)).prefault(1),
            重型移动计数: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            火力惩罚: z.string().prefault('无'),
            词条区: z.record(z.string().describe('单位名'), z.array(z.string()).prefault([])).prefault({}),
            空战: z
              .object({
                菜单开启: z.boolean().prefault(false),
                流程阶段: z
                  .enum(['遭遇', '行动点计算', '站位划分', '制空判定', '行动序列', '回合执行', '空战结算'])
                  .prefault('遭遇'),
                天气: z.enum(['万里无云', '天气晴朗', '阴雨连绵', '雷暴雨天', '台风天']).prefault('天气晴朗'),
                天气判定值: z.coerce.number().transform(v => _.clamp(v, 1, 100)).prefault(11),
                天气命中修正: z.coerce.number().transform(v => _.clamp(v, -50, 50)).prefault(5),
                天气探测修正: z.coerce.number().transform(v => _.clamp(v, -100, 100)).prefault(0),
                天气移速倍率: z.coerce.number().transform(v => _.clamp(v, 0.1, 3)).prefault(1),
                空域层: z.enum(['湍流层', '云层', '高空', '标准空域', '低空', '地面']).prefault('标准空域'),
                格距米: z.coerce.number().transform(v => _.clamp(v, 100, 2000)).prefault(500),
                我方单位: z
                  .object({
                    侦察型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    轻型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    中型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    重型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    要塞型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    其他: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                  })
                  .prefault({}),
                敌方单位: z
                  .object({
                    侦察型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    轻型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    中型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    重型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    要塞型: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                    其他: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(0),
                  })
                  .prefault({}),
                我方制空点: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
                敌方制空点: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
                制空修正: z.coerce.number().transform(v => _.clamp(v, -1, 1)).prefault(0),
                重武器命中条件: z.string().prefault('无'),
                触发突袭轮: z.boolean().prefault(false),
                突袭来源: z.string().prefault('无'),
                当前行动序列: z.array(z.string()).prefault([]),
                台风眼格: z.array(z.string()).prefault([]),
                侦查单位类型: z.enum(['侦察型', '轻型', '中型', '重型及以上']).prefault('侦察型'),
                侦查目标类型: z.enum(['侦察型', '轻型', '中型', '重型', '要塞']).prefault('轻型'),
                侦查结果: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
                目标隐匿剩余: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
                我方闪避值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(3),
                敌方闪避值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(3),
                我方近失叠加命中: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
                敌方近失叠加命中: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
                最近命中详情: z.string().prefault(''),
                我方总耐久: z.coerce.number().transform(v => _.clamp(v, 0, 99999)).prefault(100),
                敌方总耐久: z.coerce.number().transform(v => _.clamp(v, 0, 99999)).prefault(100),
                已结算回合: z.coerce.number().transform(v => _.clamp(v, 0, 9999)).prefault(0),
                最近结算摘要: z.string().prefault(''),
              })
              .prefault({}),
          })
          .prefault({}),

        装备: z
          .object({
            灵装: z.string().prefault('联合标准轻型灵装'),
            武器: z.record(
              z.string().describe('武器名'),
              z
                .object({
                  等级: z.coerce.number().transform(v => _.clamp(v, 0, 8)).prefault(1),
                  射程: z.coerce.number().transform(v => _.clamp(v, 0, 8)).prefault(2),
                  描述: z.string().prefault('制式武器'),
                })
                .prefault({}),
            ).prefault({}),
            防具: z.record(z.string().describe('防具部位'), z.string()).prefault({}),
            特殊配件: z.record(z.string().describe('配件名'), z.string().describe('效果描述')).prefault({}),
          })
          .prefault({}),

        异常状态: z.record(
          z.string().describe('状态名'),
          z
            .object({
              等级: z.enum(['严重', '致命', '快速致命']).prefault('严重'),
              效果: z.string().prefault('暂无效果描述'),
              剩余轮次: z.coerce.number().transform(v => _.clamp(v, 0, 99)).prefault(1),
            })
            .prefault({}),
        ).prefault({}),

        技能检定: z
          .object({
            最近动作: z.string().prefault('无'),
            关联属性: z.enum(['力量', '敏捷', '体质', '感知', '意志', '魅力', '学识', '无']).prefault('无'),
            原始骰点: z.coerce.number().transform(v => _.clamp(v, 1, 10)).prefault(1),
            属性加值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            难度减值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            难度说明: z.string().prefault('常规难度'),
            总值: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            结果: z.enum(['大成功', '成功', '失败', '大失败']).prefault('失败'),
            结果描述: z.string().prefault('暂无检定'),
            封锁行为: z.string().prefault(''),
            封锁至轮次: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            更新时间: z.coerce.number().prefault(0),
          })
          .prefault({}),
      })
      .prefault({}),

    战利品: z
      .object({
        显示战利品: z.boolean().prefault(false),
        当前容器: z.record(
          z.string().describe('容器名'),
          z
            .object({
              类型: z.enum(['普通', '高级']).prefault('普通'),
              已开启: z.boolean().prefault(false),
            })
            .prefault({}),
        ).prefault({}),
        最近获取: z.record(
          z.string().describe('物品名'),
          z
            .object({
              品质: z.enum(['通用', '良好', '优秀', '机密', '实验', '收藏']).prefault('通用'),
              数量: z.coerce.number().transform(v => _.clamp(v, 1, 999)).prefault(1),
              价值: z.coerce.number().transform(v => _.clamp(v, 1, 999999999)).prefault(1),
            })
            .prefault({}),
        ).prefault({}),
        副本: z
          .object({
            已激活: z.boolean().prefault(false),
            副本名称: z.string().prefault(''),
            实验室等级: z
              .enum(['基础实验室', '被封锁的实验室', '被封锁的机密实验室', '被封锁的顶点实验室'])
              .prefault('基础实验室'),
            地图规模: z.enum(['小型', '中型', '大型']).prefault('小型'),
            房间总数: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            当前房间索引: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            已探索房间: z.coerce.number().transform(v => _.clamp(v, 0, 999)).prefault(0),
            最近房间: z.string().prefault(''),
            最近结算: z.string().prefault(''),
            房间列表: z
              .array(
                z
                  .object({
                    序号: z.coerce.number().transform(v => _.clamp(v, 1, 999)).prefault(1),
                    房间名: z.string().prefault(''),
                    房间类型: z.enum(['一般', '不错', '危险', '隐藏']).prefault('一般'),
                    容器: z
                      .object({
                        普通: z.coerce.number().transform(v => _.clamp(v, 0, 9)).prefault(0),
                        高级: z.coerce.number().transform(v => _.clamp(v, 0, 9)).prefault(0),
                        上锁: z.boolean().prefault(false),
                        已搜索: z.boolean().prefault(false),
                      })
                      .prefault({}),
                  })
                  .prefault({}),
              )
              .prefault([]),
          })
          .prefault({}),
        仓库: z
          .object({
            联合币: z.coerce.number().transform(v => _.clamp(v, 0, 99999999)).prefault(0),
            芯片: z.coerce.number().transform(v => _.clamp(v, 0, 999999)).prefault(0),
            物品: z.record(
              z.string().describe('物品名'),
              z
                .object({
                  品质: z.enum(['通用', '良好', '优秀', '机密', '实验', '收藏']).prefault('通用'),
                  数量: z.coerce.number().transform(v => _.clamp(v, 0, 999999)).prefault(0),
                  价值: z.coerce.number().transform(v => _.clamp(v, 1, 999999999)).prefault(1),
                  分类: z.string().prefault('杂项'),
                  描述: z.string().prefault(''),
                  词条: z.array(z.string()).prefault([]),
                  可交易: z.boolean().prefault(true),
                })
                .prefault({}),
            ).prefault({}),
            独特收藏品: z.array(z.string()).prefault([]),
          })
          .prefault({}),
      })
      .prefault({}),

    战场日志: z.record(z.string().describe('日志标题'), z.string().describe('日志内容')).prefault({}),
  })
  .prefault({});

export type Schema = z.output<typeof Schema>;
