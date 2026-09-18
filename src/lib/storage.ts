import fs from "fs";
import path from "path";
import { InterviewProject } from "@/types";
import { normalizeProject } from "@/lib/normalize";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "projects.json");

// 预置符合 PRD 演示案例的初始数据
const INITIAL_DEMO_PROJECT: InterviewProject = {
  id: "demo-ai-director",
  title: "AI 独立导演张三：一个人如何完成一部电影",
  guestName: "张三",
  guestTitle: "AI 独立导演 / 极光视觉创始人",
  topic: "一个人如何用 AI 完成过去一个团队才能完成的电影",
  showType: "深度访谈",
  durationMinutes: 30,
  targetAudience: "影视创作者、独立开发人、科技爱好者",
  interviewStyle: "纪录片",
  focusDirection: "从传统团队到一人工业化的心理转变与行业真相",
  status: "producing",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  rawMaterials: [
    {
      id: "mat-1",
      title: "张三个人简介与创作专访（影视工业网）",
      type: "article",
      content: "张三，2019年进入传统影视行业担任副导演，2023年全面拥抱生成式AI工具（Midjourney, Sora, Runway, ComfyUI）。2024年成立极光个人工作室，并在2026年初独立完成科幻短片《回响》，全网播放量破千万。张三曾公开表示：'AI不是提升生产力那么简单，它彻底粉碎了过去的影视阶级分工。但一个人扛下全部流水线，孤独和失眠也是成倍的。'",
      addedAt: new Date().toISOString(),
    },
    {
      id: "mat-2",
      title: "朋友圈与社媒备忘录碎语",
      type: "social",
      content: "“上周推掉了老客户的传统实拍单子，对方觉得我疯了。他们不知道我用AI两天做完的样片，视觉冲击力已经超越了他们50万的实景搭建预算。但老搭档跟我绝交了，说我在砸所有人饭碗。”",
      addedAt: new Date().toISOString(),
    }
  ],
  profile: {
    identity: {
      name: "张三",
      title: "AI 独立导演 / 极光视觉创始人",
      company: "极光视觉一人工作室",
      tags: ["AI导演", "一人影视工作室", "前传统副导演", "技术变革先锋"],
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
    ],
    lastAnalyzedAt: new Date().toISOString()
  },
  chapters: [
    {
      id: "ch-1",
      order: 1,
      title: "Chapter 1：他是谁 —— 从传统剧组走出的反叛者",
      goal: "打破观众对AI创作者是'纯程序员'或'投机者'的误解，建立扎实的传统影视专业背景认知。",
      estimatedMinutes: 5,
      questions: [
        {
          id: "q-1-1",
          text: "在你全面投入AI电影之前，你在传统剧组里是怎样一种生存状态？",
          type: "normal",
          status: "asked",
          followUps: ["当时对传统影视的冗长流程最厌烦的是哪一点？", "为什么不是尝试改良，而是选择离开？"]
        },
        {
          id: "q-1-2",
          text: "你第一次意识到AI不再是玩具、而是能替你完成一部分导演工作的那个具体深夜，发生了什么？",
          type: "story",
          status: "pending",
          followUps: ["那个画面具体是什么样的？", "你当时第一反应是兴奋还是恐惧？"]
        }
      ]
    },
    {
      id: "ch-2",
      order: 2,
      title: "Chapter 2：决裂与重生 —— 成立一人工作室的豪赌",
      goal: "挖掘与老搭档冲突的真实故事，呈现技术变革时人际关系与商业价值的撕裂。",
      estimatedMinutes: 7,
      questions: [
        {
          id: "q-2-1",
          text: "资料提到有老搭档认为你在砸大家的饭碗甚至绝交，那天你们的对话是怎样的？",
          type: "deep",
          status: "pending",
          followUps: ["你当时有试图解释吗？", "事后有没有哪个瞬间感到后悔或动摇？"]
        }
      ]
    },
    {
      id: "ch-3",
      order: 3,
      title: "Chapter 3：新的工作流 —— 一个人如何打赢一场战役",
      goal: "硬核干货拆解，满足目标受众对工作流细节和审美控制力的好奇。",
      estimatedMinutes: 8,
      questions: [
        {
          id: "q-3-1",
          text: "在独立完成《回响》这几个月里，你的典型一天是怎么度过的？",
          type: "story",
          status: "pending",
          followUps: ["AI生成的废镜头比例有多高？", "你是如何让AI保持角色脸部与光影一致性的？"]
        }
      ]
    },
    {
      id: "ch-4",
      order: 4,
      title: "Chapter 4：代价与虚无 —— 效率狂飙背后的精神黑洞",
      goal: "直击灵魂的冲突点，探讨技术狂欢背后的心理代价。",
      estimatedMinutes: 5,
      questions: [
        {
          id: "q-4-1",
          text: "AI让你一个人具备了十个人的产能，但这是在解放你，还是把你变成了算力流水线上的全天候奴隶？",
          type: "deep",
          status: "pending",
          followUps: ["有哪一刻你甚至想摔掉鼠标彻底不干了？", "那种极端的孤独感是如何排解的？"]
        }
      ]
    },
    {
      id: "ch-5",
      order: 5,
      title: "Chapter 5：终局预言 —— 影视行业的未来秩序",
      goal: "升华访谈立意，给出对年轻一代创作者极具分量的行业研判与金句。",
      estimatedMinutes: 5,
      questions: [
        {
          id: "q-5-1",
          text: "三年后，如果剧组只保留一个岗位，你认为会是导演还是提示词工程师？",
          type: "deep",
          status: "pending",
          followUps: ["那些还在电影学院按传统模式学习的学生，现在最应该做的一件事是什么？"]
        }
      ]
    }
  ],
  simulationSession: {
    id: "sim-1",
    projectId: "demo-ai-director",
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: "msg-1",
        role: "interviewer",
        content: "张导您好，您过去在传统影视干了四年，为什么突然彻底转型做一人AI电影？",
        timestamp: "10:00"
      },
      {
        id: "msg-2",
        role: "guest",
        content: "（喝了一口水，苦笑）其实不是我主动选择的，是在传统剧组耗得太疼了。一部片子80%的时间都在处理沟通损耗、制片扯皮，到了拍摄现场因为预算超标改剧本。2023年一个深夜我第一次用Midjourney跑出了一个太空站镜头，和我脑海里想的几乎一模一样，那天晚上我失眠了，我知道旧世界要塌了。",
        timestamp: "10:01"
      },
      {
        id: "msg-3",
        role: "interviewer",
        content: "那您成立工作室后，具体是怎么做《回响》这部长片的？",
        timestamp: "10:02"
      },
      {
        id: "msg-4",
        role: "guest",
        content: "前期剧本我来写，分镜我用ComfyUI搭建了专门的工作流。但最痛苦的是镜头连续性，跑了上千遍废片。整整四个月我基本没出过门，外卖盒子堆满了房间。",
        timestamp: "10:03"
      }
    ],
    reviewReport: {
      overallRating: 82,
      summary: "主持人整体节奏平稳，提问覆盖了转型原因与工作流。但在第2个问题时错过了极具深度的情绪挖掘点。",
      strengths: [
        "开场直接切入核心转变，嘉宾快速进入回忆状态。",
        "语言简洁，没有冗长的前置铺垫。"
      ],
      missedOpportunities: [
        {
          dialogueSnippet: "嘉宾说：'那天晚上我失眠了，我知道旧世界要塌了。' -> 主持人直接转入'具体怎么做长片'。",
          reason: "嘉宾此时流露出了巨大的历史感与情绪张力，应该顺势深挖那一夜的心态与恐惧感，而不是生硬跳到技术流。",
          suggestedFollowUp: "“那天晚上失眠时，你脑海里最先浮现出的是哪张面孔？是对谁的歉意，还是对未来的恐慌？”"
        }
      ],
      redundantQuestions: [],
      overallAdvice: [
        "在正式访谈中，对嘉宾的情绪关键词（如'旧世界塌了'、'疼'、'扯皮'）保持极高敏感度。",
        "技术流程可以作为佐证，人物内心的撕扯才是引发共鸣的杀手锏。"
      ]
    }
  },
  transcript: [
    {
      id: "tr-1",
      speaker: "主持人",
      timecode: "00:01:15",
      text: "张导，很多人觉得AI做电影就是动动嘴皮子敲键盘，真实情况是这样吗？",
      tag: "引出争议"
    },
    {
      id: "tr-2",
      speaker: "嘉宾",
      timecode: "00:01:28",
      text: "这绝对是天大的误解。AI没有让导演变得轻松，它反而剥夺了所有偷懒的借口。以前你可以怪美术画得慢，怪灯光没到位，现在全流程只有你一个人，哪怕有一帧不对，全是你的审美问题。",
      isHighlight: true,
      tag: "🔥 潜在短视频观点"
    },
    {
      id: "tr-3",
      speaker: "主持人",
      timecode: "00:04:30",
      text: "听说因为做AI短片，几个多年的老朋友和你形同陌路？",
    },
    {
      id: "tr-4",
      speaker: "嘉宾",
      timecode: "00:04:45",
      text: "是的，我一个十几年的摄影兄弟，在微信群里骂我是在给资本家递绞索。但我想说的是，AI没有让导演消失，它只是让更多有表达欲的普通人拿到了导筒。",
      isHighlight: true,
      tag: "🔥 核心爆款金句"
    }
  ],
  shortVideos: [
    {
      id: "sv-1",
      title: "《AI不是省力，它剥夺了导演所有偷懒的借口》",
      duration: "00:48",
      inPoint: "00:01:25",
      outPoint: "00:02:13",
      coreOpinion: "全流程一人化的残酷真相：所有瑕疵都无可推脱",
      coverTitle: "AI电影残酷真相：你再也怪不了任何人",
      scriptSnippet: "很多人以为敲键盘就能拍电影，其实AI反而剥夺了所有偷懒的借口。以前你可以怪摄影怪美术，现在哪怕有一帧不对，都是你自己的审美缺陷。"
    },
    {
      id: "sv-2",
      title: "《因为用AI拍片，我被最好的摄影朋友拉黑了》",
      duration: "01:05",
      inPoint: "00:04:28",
      outPoint: "00:05:33",
      coreOpinion: "技术浪潮冲击下的人性与友情裂变",
      coverTitle: "被骂“给资本递绞索”：一个AI导演的决裂日记",
      scriptSnippet: "他觉得我在砸大家的饭碗。但历史的车轮从来不讲情面。AI没有让导演消失，它只是让更多真正有表达欲的人拿到了导筒。"
    }
  ],
  quotes: [
    {
      id: "q-1",
      text: "AI 没有让导演消失，它只是让更多真正有表达欲的人拿到了导筒。",
      timecode: "00:05:12",
      category: "行业破局",
      socialHooks: {
        xiaohongshu: "爆肝做AI电影这三年，我终于想通了一件事...💡 送给所有还在观望的技术创作者",
        weibo: "【对话AI独立导演】“AI没有消灭电影，它只是把导筒还给了有故事的人。” #AI影视 #创作者现状",
        posterCaption: "当技术门槛归零，唯有思想与审美永存。"
      }
    },
    {
      id: "q-2",
      text: "当工具能替你画出所有画面时，你唯一的瓶颈就是你的精神深度与审美颗粒度。",
      timecode: "00:18:40",
      category: "创作认知",
      socialHooks: {
        xiaohongshu: "AI时代，创作者最值钱的能力到底是什么？看完这位独立导演的采访我沉默了...",
        weibo: "技术的尽头是审美。#AI创作的真实瓶颈不是算力，是审美#",
        posterCaption: "工具在狂奔，灵魂在拷问。"
      }
    }
  ],
  packaging: {
    youtubeTitle: "一个人搞定一部科幻电影？深度对谈AI独立导演张三：技术狂欢背后的孤独与反叛",
    bilibiliTitle: "【深度访谈】全流程一人拍电影！对话AI导演张三：传统影视人眼中的颠覆与真相",
    douyinTitle: "一个人就是一支剧组！AI独立导演首度公开幕后心酸：我被朋友骂砸饭碗",
    xiaohongshuTitle: "对话AI导演张三｜一个人怎么做出一整部电影？真实成本与工作流大公开！",
    showDescription: "本期节目我们邀请到前传统影视副导演、现极光视觉创始人张三。面对生成式AI席卷影视行业，他选择了一条激进的道路——解散团队、退掉商业实拍单，全流程一人操盘30分钟科幻长片。在这场30分钟的深度对谈中，他不仅毫无保留地拆解了一人电影工业化的工作流，更坦露了技术飞跃背后承受的同行非议、精神孤寂与对未来影视秩序的冷峻预判。",
    chaptersTimeline: "00:00 - 序幕与嘉宾介绍\n02:15 - 决裂时刻：离开传统剧组的那一夜\n08:40 - 揭秘一人电影全流程工作流\n16:20 - 友谊决裂与砸饭碗争议\n23:10 - 效率狂飙背后的精神黑洞\n28:30 - 给年轻创作者的终极建议",
    seoKeywords: ["AI导演", "影视制作", "独立电影", "Midjourney", "Sora", "生成式AI", "创作者访谈", "访谈助手"]
  }
};

export class StorageService {
  private static ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([INITIAL_DEMO_PROJECT], null, 2), "utf-8");
    }
  }

  static getProjects(): InterviewProject[] {
    this.ensureDataDir();
    try {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      // 统一在读取处归一化：无论数据是怎么写进来的（AI 缺字段、手工编辑、
      // 旧版本格式），UI 拿到的都是完整形状，不会因 undefined 访问而白屏。
      return (Array.isArray(parsed) ? parsed : []).map(normalizeProject);
    } catch (e) {
      console.error("Failed to read projects from storage", e);
      return [INITIAL_DEMO_PROJECT];
    }
  }

  static getProjectById(id: string): InterviewProject | null {
    const projects = this.getProjects();
    return projects.find((p) => p.id === id) || null;
  }

  static saveProject(project: InterviewProject): InterviewProject {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    project.updatedAt = new Date().toISOString();

    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.unshift(project);
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), "utf-8");
    return project;
  }

  static deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length !== projects.length) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), "utf-8");
      return true;
    }
    return false;
  }

  /**
   * 原子地「重新读取 → 应用变更 → 写回」。
   *
   * AI 路由的典型流程是「读项目 → 等 LLM（真实模型下要数秒）→ 整体写回」。
   * 等待期间用户的其它操作（标记已问、编辑笔记、录入资料）会被这份过期快照整体覆盖。
   *
   * 改成写回时重新读取最新数据、只应用本路由负责的字段，就不会丢并发更新。
   * 函数体全程同步（同步 fs + 单线程），不会与其他请求交错执行。
   */
  static updateProject(
    id: string,
    mutate: (project: InterviewProject) => InterviewProject
  ): InterviewProject | null {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index < 0) return null;

    const next = mutate(projects[index]);
    next.id = id;
    next.updatedAt = new Date().toISOString();
    projects[index] = next;

    fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), "utf-8");
    return next;
  }
}
