# Lightweight Low-Code Pipeline Framework

## Table of Contents

1. Introduction
2. Features
3. Concepts
4. Installation
5. Basic Usage
6. Advanced Usage
7. Serialization and Deserialization
8. Troubleshooting
9. Conclusion

## 1. Introduction

This lightweight low-code Pipeline Framework aims to simplify the process of executing complex, sequential, and dependent tasks. Designed with extensibility and modularity in mind, it lets you focus on what's important—your business logic—while it takes care of task orchestration.

## 2. Features

- **Lightweight**: Minimal setup required.
- **Low-Code**: Easy to configure with minimal code.
- **Batching**: Supports batch processing of tasks.
- **Timeouts and Retries**: Automatic retry logic and timeout control.
- **Dependency Management**: Allows task dependencies.
- **Event-Driven**: Comes with a simple EventEmitter.
- **Serializability**: Can serialize and deserialize pipelines.

## 3. Concepts

- **Pipe**: A unit of work.
- **Pipeline**: A series of interconnected Pipes.
- **PipelineContext**: Shared context between Pipes.

## 4. Installation

As this is a code-based framework, include it in your project by copying the source code.

## 5. Basic Usage

### Creating a Pipe

```ts
const myPipe = new Pipe(async (input: number, context: PipelineContext) => {
  return input * 2;
}, {id: 'double'});
```

### Creating a Pipeline

```ts
const myPipeline = new Pipeline([myPipe]);
```

### Executing the Pipeline

```ts
const results = await myPipeline.execute(2);
```

## 6. Advanced Usage

### Batching

Enable batching on a Pipe:

```ts
myPipe.enableBatching();
```

### Dependencies

```ts
myPipe.setDependencies(['anotherPipe']);
```

### Retries

```ts
myPipe.setRetries(3);
```

### Preprocess and Postprocess

Customize input or output.

## 7. Serialization and Deserialization

You can serialize a pipeline into JSON, allowing you to save configurations and restore them later.

## 8. Troubleshooting

- **Dependency Errors**: Ensure dependencies exist before executing the pipeline.
- **Timeouts and Retries**: Adjust these options according to your needs.

## 9. Conclusion

This lightweight, low-code Pipeline Framework is a robust solution for simplifying complex task orchestration. With built-in features like batching, retries, and dependency management, it offers a scalable approach to solve various automation challenges.
