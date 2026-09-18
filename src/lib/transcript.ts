import { TranscriptItem } from "@/types";

/** 判定「高光」的关键词（沿用原有口径） */
const HIGHLIGHT_MARKERS = ["🔥", "金句", "观点"];

/** 时间码：优先行首，其次任意位置的方括号形式 */
const LEADING_TIMECODE = /^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*/;
const ANY_TIMECODE = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/;

/** 行首「标签：」形式，标签不含标点且不超过 16 字 */
const SPEAKER_PREFIX = /^([^:：]{1,16})[:：]\s*/;

export interface ParsedTranscriptLine {
  speaker: TranscriptItem["speaker"];
  timecode: string;
  text: string;
  isHighlight: boolean;
}

/**
 * 解析单行逐字稿，支持以下写法：
 *   [00:01:15] 主持人: 内容
 *   [00:01:15] 嘉宾：内容
 *   00:01:15 张三: 内容
 *   内容（无前缀时退化为启发式判断）
 *
 * 注意：说话人判定必须基于「行首标签」，不能基于「整行是否出现嘉宾名」——
 * 否则「主持人: 张三，你怎么看？」这类提问会被误判成嘉宾发言。
 */
export function parseTranscriptLine(
  raw: string,
  guestName: string
): ParsedTranscriptLine {
  const trimmed = raw.trim();
  let rest = trimmed;

  // 1. 时间码
  let timecode = "";
  const head = rest.match(LEADING_TIMECODE);
  if (head) {
    timecode = head[1];
    rest = rest.slice(head[0].length);
  } else {
    const bracket = rest.match(ANY_TIMECODE);
    if (bracket) {
      timecode = bracket[1];
      rest = rest.replace(bracket[0], "").trim();
    }
  }

  // 2. 说话人前缀
  let speaker: TranscriptItem["speaker"] | null = null;
  const prefix = rest.match(SPEAKER_PREFIX);
  if (prefix) {
    const label = prefix[1].trim();
    const isShortLabel = label.length <= 8 && !/[。！？，、,.!?；;]/.test(label);

    if (label.includes("嘉宾") || (guestName && label.includes(guestName))) {
      speaker = "嘉宾";
    } else if (label.includes("主持") || label.includes("采访")) {
      speaker = "主持人";
    } else if (isShortLabel) {
      // 「张三:」这类人名标签：与嘉宾名一致算嘉宾，其余按主持人处理
      speaker = guestName && label.includes(guestName) ? "嘉宾" : "主持人";
    }

    if (speaker) rest = rest.slice(prefix[0].length);
  }

  // 3. 没有可识别前缀时退化为启发式：仅当行首就是嘉宾名才认为是嘉宾
  if (!speaker) {
    if (guestName && rest.startsWith(guestName)) {
      speaker = "嘉宾";
      rest = rest.slice(guestName.length).replace(/^[:：]\s*/, "");
    } else {
      speaker = "主持人";
    }
  }

  return {
    speaker,
    timecode,
    text: rest.trim(),
    isHighlight: HIGHLIGHT_MARKERS.some((m) => trimmed.includes(m)),
  };
}
