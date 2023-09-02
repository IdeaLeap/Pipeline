# Batch Processing Module

## Introduction

This module is part of a low-code pipeline framework designed to handle batch processing tasks efficiently. It provides a `batchDecorator` function that takes in another function (or an array of functions) and an optional `BatchOptions` object. This allows you to run the given function(s) across a batch of inputs with optional pre- and post-processing steps.

## Table of Contents

- [Quick Start](#quick-start)
- [Type Definitions](#type-definitions)
- [API](#api)
- [Examples](#examples)

## Quick Start

```ts
import { batchDecorator } from "@idealeap/pipeline";

const doubled = async (x: number) => x * 2;

const batchedDouble = batchDecorator(doubled, {
  onProgress: (completed, total) => {
    console.log(`Completed: ${completed}, Total: ${total}`);
  },
});

const result = await batchedDouble([1, 2, 3, 4, 5]);
console.log(result); 

```

## Type Definitions

### Awaited

A utility type that unwraps a Promise to its inferred type.

```ts
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
```

### BatchOptions<T, R>

An interface to specify additional options for batch processing.

```ts
interface BatchOptions<T, R> {
  onData?: (input: T) => T;
  onBatchData?: (inputs: T[]) => T[] | T;
  onResult?: (result: Awaited<R>) => Awaited<R>;
  onBatchResult?: (results: Awaited<R>[]) => Awaited<R>[] | Awaited<R>;
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: any) => void;
}
```

## API

### batchDecorator<T, R>

Main function to create a batch processing decorator.

```ts
function batchDecorator<T, R>(
  fn: ((input: T) => Promise<R> | R) | ((input: T) => Promise<R> | R)[],
  options?: BatchOptions<T, R>,
): (input: T | T[]) => Promise<Awaited<R> | Awaited<R>[]>;
```

## Examples

### Easy Example

```ts
const fn = (x: string) => {
  return `_-${x}-_`;
};
const res = await batchDecorator(fn, {
  onResult: (x: string) => {
    return `*${x}*`;
  },
})(["a", "b", "c"]);
console.log(res);
```

### Basic Example

```ts
const asyncMultiplyByTwo = async (x: number): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(x * 2);
    }, 100);
  });
};

const asyncAddThree = async (x: number): Promise<number> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(x + 3);
    }, 100);
  });
};

const batchedFunctions = batchDecorator([asyncMultiplyByTwo, asyncAddThree], {
  onData: (x: number) => x + 1,
  onResult: (x: number) => x * 10,
  onProgress: (completed, total) => {
    console.log(`Completed: ${completed}, Total: ${total}`);
  },
});

await (async () => {
  const results = await batchedFunctions([1, 2, 3]);
  console.log("Final Results:", results);//[40, 60, 80, 50, 60, 70]
})();
```

### BatchResult

```ts
const fn = (x: string) => {
  return `_-${x}-_`;
};
const res = await batchDecorator(fn, {
  onBatchResult: (x: string[]) => {
    return `*${JSON.stringify(x)}*`;
  },
})(["a", "b", "c"]);
console.log(res);//*["_-a-_","_-b-_","_-c-_"]*
```
