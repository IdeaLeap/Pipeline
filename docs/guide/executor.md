# DynamicExecutor Module

## Introduction

The `DynamicExecutor` class is a part of a low-code pipeline framework aimed at executing arbitrary code dynamically. It allows code execution with an optional configuration that controls various aspects like timeout, logging, environment variables, and more.

## Table of Contents

- [Quick Start](#quick-start)
- [Type Definitions](#type-definitions)
- [API](#api)
- [Examples](#examples)

## Quick Start

```ts
import { DynamicExecutor } from "@idealeap/pipeline";

const executor = new DynamicExecutor({ logging: true });

const result = await executor.execute("return args[0] + args[1]", 1, 2);
console.log(result); // Output: 3
```

## Type Definitions

### ExecutorConfig

An interface to specify configuration options for the `DynamicExecutor`.

```ts
interface ExecutorConfig {
  timeout?: number;
  logging?: boolean;
  environment?: Record<string, any>;
  allowedBuiltins?: string[];
  beforeExecute?: (code: string) => void;
  afterExecute?: (result: any, code: string, error?: Error) => void;
  validateCode?: (code: string) => boolean;
}
```

## API

### DynamicExecutor Class

#### `constructor(config?: ExecutorConfig)`

Creates a new instance of the `DynamicExecutor` with optional configuration.

#### `execute<T = any>(code: string, ...args: any[]): Promise<T | null>`

Executes the provided code and returns a Promise that resolves to the result or `null` if an error occurs.

#### `static run(params: { code: string; config?: ExecutorConfig }): Promise<any>`

Static method to run a code block with an optional configuration.

## Examples

### Basic Usage

```ts
const executor = new DynamicExecutor();
const result = await executor.execute("return args[0] * 2", 5);
console.log(result); // Output: 10
```

### With Timeout

```ts
const executor = new DynamicExecutor({ timeout: 1000 });
const result = await executor.execute("while(true);", 5);
console.log(result); // Output: Error - Timeout
```

### With Logging

```ts
const executor = new DynamicExecutor({ logging: true });
const result = await executor.execute("return args[0] + args[1]", 1, 2);
```

### Using Before and After Hooks

```ts
const config: ExecutorConfig = {
  beforeExecute: (code) => {
    console.log(`About to execute: ${code}`);
  },
  afterExecute: (result, code, error) => {
    if (error) {
      console.log(`Error during execution: ${error}`);
    } else {
      console.log(`Executed ${code} and got result ${result}`);
    }
  },
};

const executor = new DynamicExecutor(config);
const result = await executor.execute("return args[0] + args[1]", 1, 2);
```

### With Environment Variables

```ts
const executor = new DynamicExecutor({
  logging: true,
  timeout: 5000,
  environment: { customVar: "Hello, world!" },
  allowedBuiltins: ["fetch"],
});

await(async () => {
  const result = await executor.execute<number | string | null>(
    `
  if (fetch) {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      const data = await response.json();
      return data.id;
    } catch (e) {
      return 'Fetch failed';
    }
  } else {
    return customVar.length + args[0] + args[1];
  }
`,
    1,
    2,
  );
  expect(result).toEqual(16);
  console.log(result);
})();
```
