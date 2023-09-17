<div align="center">
<img src="https://github.com/IdeaLeap/Pipline/assets/49270362/eae58b53-77e9-41f2-913a-baeccdf4b962" style="width:100%;" alt="IdeaLeap Logo">
</div>
</p>
<p align="center">A Lightweight Low-code Pipeline code by GPT-4.</p>

## 📦 Installation

```bash
npm install @idealeap/pipeline
```

## ✨ Features

- 🔄 **Lightweight & Low-code**
- 🛠️ Pipeline Organization: Manage tasks easily
- 🔧 Custom Steps: Define preprocessing, post-processing, and more
- 🚄 Batch Support: Efficiently handle large data sets
- 📊 Event-Driven: Monitor progress seamlessly
- ⏳ Timeouts: Execute within limits
- ⚙️ Dependency Management: Ensure correct order
- 📈 Scalable: Add new step types easily

## 🚀 Usage

### Basic Usage

```typescript
const pipe1 = new Pipe((input, context) => input * 2, { id: "pipe1" });
const pipe2 = new Pipe((input, context) => input + 1, { id: "pipe2" });

const pipeline = new Pipeline([pipe1, pipe2]);
pipeline.execute(2).then((result) => console.log(result));
```

### Event-Driven

```typescript
const pipe1 = new Pipe<number, number>(
  (input) => {
    return input + 1;
  },
  {
    id: "pipe1",
  },
);

const pipe2 = new Pipe<number, number>(
  (input) => {
    return input * 2;
  },
  {
    id: "pipe2",
  },
);

const pipeline = new Pipeline([pipe1, pipe2], {
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
});

// 执行管道
await pipeline.execute(1).then((results) => {
  console.log("Final results:", results);
});
```

### Batch Support & Dynamic JS Executor

```typescript
const pipe1 = new Pipe(
  (input: string) => {
    return input + "——————(被我测了";
  },
  {
    id: "pipe1",
    batch: true,
    onBatchResult: (x: string[]) => {
      return `*${x.join("\n")}*`;
    },
  },
);
const pipe2 = new Pipe(
  async (input: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return input + "\n\n你看看你测试了多少！！🤬😡";
  },
  {
    id: "pipe2",
  },
);
const pipe3 = new Pipe(
  async (input: string) => {
    const res = await DynamicExecutor.run({
      code: `console.log(\`${input}\`);
      return \`${input}\`;`,
    });
    console.log(res);
    return input;
  },
  {
    id: "pipe3",
  },
);
const pipeline = new Pipeline([pipe1, pipe2, pipe3], {
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
});

// 执行管道
const res = await pipeline.execute([
  "我是甲，别测我┭┮﹏┭┮",
  "我是乙，求你测我┭┮﹏┭┮",
  "我是丙，来啊你以为我怕你！",
  "我是丁，你敢？！滚一边去~",
]);
```

### Chain Call

```typescript
const pipeline = Pipeline.create()
  .addPipe(
    Pipe.create((input: number) => input + 1, {
      id: "step1",
    }).setDescription("Increment by 1"),
  )
  .addPipe(
    Pipe.create((input: number) => input * 2, {
      id: "step2",
    }).setDescription("Multiply by 2"),
  )
  .setOnProgress((completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  });

// 执行
await pipeline.execute(1).then((result) => {
  console.log("Final result:", result);
});

// 序列化为 JSON
const jsonConfig = JSON.stringify(pipeline.toJSON());
console.log("Serialized config:", jsonConfig);
```

### Function Map

```typescript
// 示例
const jsonConfig: SerializablePipelineOptions = {
  pipes: [{ id: "step1" }, { id: "step2", timeout: 1000 }],
};

const fnMap = {
  step1: (input: string) => `${input}-step1`,
  step2: (input: string) => `${input}-step2`,
};

const pipeline = Pipeline.fromJSON(jsonConfig, fnMap);

// 执行 Pipeline
await pipeline.execute("我饿").then(console.log);
```

### Low Code

```typescript
const pipeRegistry = PipeRegistry.init();
// 注册预定义的 Pipe 类型
pipeRegistry.register("FetchData", async () => {
  // 这里用一个简单的 setTimeout 来模拟异步数据获取
  return new Promise((resolve) =>
    setTimeout(() => resolve("fetched data"), 1000),
  );
});

pipeRegistry.register("TransformData", () => {
  // 这里只是简单地返回一个字符串，实际情况可能涉及到更复杂的数据转换
  // console.log(input, context);
  return "transformed data";
});

pipeRegistry.register("postProcess", (input: string) => {
  // 这里只是简单地返回一个字符串，实际情况可能涉及到更复杂的数据转换
  // console.log(input, context);
  return input + "\nBy the way, I'm postProcess";
});

const pipelineJson = {
  pipes: [
    {
      id: "FetchData",
      type: "FetchData",
    },
    {
      id: "TransformData",
      type: "TransformData",
      postProcessType: "postProcess",
    },
  ],
};

const pipeline = Pipeline.fromJSON(pipelineJson, {}, pipeRegistry);

// 序列化为 JSON
const jsonConfig = JSON.stringify(pipeline.toJSON());
console.log("Serialized config:", jsonConfig);

// 导入 JSON
const newPipeline = Pipeline.fromJSON(JSON.parse(jsonConfig), {}, pipeRegistry);

// 执行
await newPipeline.execute().then(console.log);
```

## 📄 Author

(C) 2023 GPT-4, Marlene, Idealeap
