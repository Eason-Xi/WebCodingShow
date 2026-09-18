import { PROMPTS } from "./prompts";

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class LLMGateway {
  private static getApiKey(): string | null {
    return process.env.OPENAI_API_KEY || null;
  }

  private static getBaseUrl(): string {
    return process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  private static getModel(): string {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  /**
   * 统一大模型生成方法
   */
  static async chat(messages: ChatCompletionMessage[], jsonMode: boolean = false): Promise<string> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const model = this.getModel();

    if (!apiKey) {
      console.warn("未检测到 OPENAI_API_KEY，使用高质量智能 Mock 引擎生成响应");
      return this.mockResponse(messages, jsonMode);
    }

    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("LLM API 调用失败:", errText);
        // 如果云端 API 失败，降级回 Mock，确保 UI 不崩溃
        return this.mockResponse(messages, jsonMode);
      }

      const data = await res.json();
      return data.choices[0]?.message?.content || "";
    } catch (err) {
      console.error("LLM 调用异常:", err);
      return this.mockResponse(messages, jsonMode);
    }
  }

  /**
   * 智能本地兜底生成器（确保零配置下体验丝滑）
   */
  private static mockResponse(messages: ChatCompletionMessage[], jsonMode: boolean): string {
    const lastMsg = messages[messages.length - 1]?.content || "";

    // 1. 判断是否为人物画像提取
    if (lastMsg.includes("人物最值得被提问的灵魂张力") || lastMsg.includes("identity")) {
      return JSON.stringify({
        identity: {
          name: "张三",
          title: "AI 独立导演 / 极光视觉创始人",
          company: "极光视觉一人工作室",
          tags: ["AI导演", "一人影视工作室", "技术变革先锋", "前传统副导演"],
          summary: "从传统影视制作体系出走的革新者，率先跑通单人端到端AI影视制作流程，既享受前所未有的创作掌控力，又承受着同行争议与极端工作强度的拉扯。"
        },
        timeline: [
          { period: "2019", event: "进入传统影视制作公司担任副导演，经历传统剧组繁琐流程", significance: "熟悉传统工业痛点与人员沟通损耗" },
          { period: "2023", event: "初次尝试生成式AI辅助分镜绘制", significance: "思想启蒙期，发现AI质感的突破" },
          { period: "2024", event: "正式成立个人一人AI工作室，与传统合作方分道扬镳", significance: "决裂与彻底转型" },
          { period: "2026", event: "独自操盘完成30分钟科幻长片《回响》", significance: "验证一人制片全链路的可行性" }
        ],
        representativeWorks: [
          { title: "科幻片《回响》", desc: "耗时4个月全流程一人完成分镜、资产、动态与音效合成", impact: "引发影视行业大讨论" },
          { title: "商业短片《机械晨曦》", desc: "两天内交付的高概念品牌样片", impact: "彻底改变传统客户认知" }
        ],
        keyOpinions: [
          "AI 不只是提高影视制作效率，而是从底层摧毁并重塑创作者的组织方式。",
          "当工具门槛归零时，真正的门槛变成了你的文学底蕴与审美颗粒度。",
          "一个人是一支军队，也意味着你独自面对所有的创作焦虑。"
        ],
        valuableStories: [
          "第一次用AI生成分镜时，原本需要美工画两周的内容在半小时内成型，当时手心冒汗浑身颤抖。",
          "第一次因为坚持使用AI流程被合作多年的传统摄影指导当面痛斥并退群。",
          "独自熬夜48小时渲染《回响》关键高潮戏，电脑风扇咆哮中体会到的绝望与狂喜。"
        ],
        conflicts: [
          "曾经是传统胶片与实景搭建的死忠粉，如今却成为全面数字生成化的激进推崇者。",
          "技术上实现了10倍效率跃升，精神上却承受着比过去剧组管理更极端的心理高压与孤独感。",
          "渴望行业理解拥抱新技术，但又深深警惕同质化算力流水线对纯粹艺术审美的侵蚀。"
        ],
        blanks: [
          "2024年初离开传统团队时，是否发生过直接的利益决裂或激烈的当面争吵？现有资料语焉不详。",
          "他在一人完成长片期间的商业收入模型与真实成本构成究竟如何？"
        ],
        top5Directions: [
          "决裂时刻：离开传统工业那一刻，到底经历了什么触动神经的关键事件？",
          "全流程拆解：今天一个人做一部科幻电影，他的核心工作流长什么样？",
          "孤独与代价：十倍效率的背后，创作者付出了怎样的身心代价？",
          "人机博弈：当AI给出的画面超出预期时，究竟谁才是真正的导演？",
          "未来预言：未来影视剧组还会剩下几个职位？年轻创作者该何去何从？"
        ]
      }, null, 2);
    }

    // 2. 判断是否为策划大纲生成
    if (lastMsg.includes("设计一套像电影叙事般流畅有力的采访大纲") || lastMsg.includes("chapters")) {
      return JSON.stringify({
        chapters: [
          {
            order: 1,
            title: "Chapter 1：他是谁 —— 从传统剧组走出的反叛者",
            goal: "打破观众对AI创作者是'纯程序员'或'投机者'的误解，建立扎实的传统影视专业背景认知。",
            estimatedMinutes: 5,
            questions: [
              {
                text: "在你全面投入AI电影之前，你在传统剧组里是怎样一种生存状态？",
                type: "normal",
                followUps: ["当时对传统影视的冗长流程最厌烦的是哪一点？", "为什么不是尝试改良，而是选择离开？"]
              },
              {
                text: "你第一次意识到AI不再是玩具、而是能替你完成一部分导演工作的那个具体深夜，发生了什么？",
                type: "story",
                followUps: ["那个画面具体是什么样的？", "你当时第一反应是兴奋还是恐惧？"]
              }
            ]
          },
          {
            order: 2,
            title: "Chapter 2：决裂与重生 —— 成立一人工作室的豪赌",
            goal: "挖掘与老搭档冲突的真实故事，呈现技术变革时人际关系与商业价值的撕裂。",
            estimatedMinutes: 7,
            questions: [
              {
                text: "资料提到有老搭档认为你在砸大家的饭碗甚至绝交，那天你们的对话是怎样的？",
                type: "deep",
                followUps: ["你当时有试图解释吗？", "事后有没有哪个瞬间感到后悔或动摇？"]
              }
            ]
          },
          {
            order: 3,
            title: "Chapter 3：新的工作流 —— 一个人如何打赢一场战役",
            goal: "硬核干货拆解，满足目标受众对工作流细节和审美控制力的好奇。",
            estimatedMinutes: 8,
            questions: [
              {
                text: "在独立完成《回响》这几个月里，你的典型一天是怎么度过的？",
                type: "story",
                followUps: ["AI生成的废镜头比例有多高？", "你是如何让AI保持角色脸部与光影一致性的？"]
              }
            ]
          },
          {
            order: 4,
            title: "Chapter 4：代价与虚无 —— 效率狂飙背后的精神黑洞",
            goal: "直击灵魂的冲突点，探讨技术狂欢背后的心理代价。",
            estimatedMinutes: 5,
            questions: [
              {
                text: "AI让你一个人具备了十个人的产能，但这是在解放你，还是把你变成了算力流水线上的全天候奴隶？",
                type: "deep",
                followUps: ["有哪一刻你甚至想摔掉鼠标彻底不干了？", "那种极端的孤独感是如何排解的？"]
              }
            ]
          },
          {
            order: 5,
            title: "Chapter 5：终局预言 —— 影视行业的未来秩序",
            goal: "升华访谈立意，给出对年轻一代创作者极具分量的行业研判与金句。",
            estimatedMinutes: 5,
            questions: [
              {
                text: "三年后，如果剧组只保留一个岗位，你认为会是导演还是提示词工程师？",
                type: "deep",
                followUps: ["那些还在电影学院按传统模式学习的学生，现在最应该做的一件事是什么？"]
              }
            ]
          }
        ]
      }, null, 2);
    }

    // 3. 判断是否为模拟复盘报告生成
    if (lastMsg.includes("访谈第二导演") || lastMsg.includes("overallRating")) {
      return JSON.stringify({
        overallRating: 84,
        summary: "主持人整体节奏推进流畅，问题逻辑层层递进。但在关键情绪冲突处略显仓促，建议给予嘉宾更多展开故事细节的追问空间。",
        strengths: [
          "开篇问题准确切中嘉宾的核心转折点，破冰迅速且有力。",
          "问题覆盖面兼顾了宏观行业判断与微观创作日常。"
        ],
        missedOpportunities: [
          {
            dialogueSnippet: "嘉宾提到：'整整四个月我基本没出过门，外卖盒子堆满了房间。'",
            reason: "此处嘉宾已经展现出了极高的人格脆弱感与心理压力，主持人应该立刻顺着'外卖盒子'追问极端情绪时刻，深挖心理代价。",
            suggestedFollowUp: "“在那四个月里，有没有哪一天看着满屋的盒子，你甚至怀疑过自己这部片子根本没人看？”"
          }
        ],
        redundantQuestions: [
          "避免连续使用“那后来呢？”这样宽泛的提问，多使用代入感强的封闭式或细节追问。"
        ],
        overallAdvice: [
          "现场提问时注意观察受访者的停顿与叹息，声音放轻追问情感细节。",
          "多用“当时那个具体画面是什么”代替抽象的“你怎么看”。"
        ]
      }, null, 2);
    }

    // 4. 默认对话回复（模拟嘉宾对练）
    return `（思索了片刻）你问到这个痛处了。其实做一人AI影视最难的从来不是写代码调参数，而是心理上的自我怀疑。以前在剧组大家一起扛，现在全流程只有你一个人。当你盯着屏幕渲染到凌晨四点，发现生成的角色手部依然有瑕疵时，那种崩溃感是过去几十人的团队里从没体会过的。但当我看到成片第一次在影厅点映，全场安静下来的那一瞬，我知道这一切都值了。`;
  }
}
