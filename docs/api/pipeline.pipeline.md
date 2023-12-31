<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@idealeap/pipeline](./pipeline.md) &gt; [Pipeline](./pipeline.pipeline.md)

## Pipeline class

Represents a pipeline that consists of multiple pipes, offering methods to execute them sequentially, add or remove pipes, and serialize the pipeline configuration.

**Signature:**

```typescript
export declare class Pipeline 
```

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(pipes, options)](./pipeline.pipeline._constructor_.md) |  | Constructs a new Pipeline instance. |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [addPipe(pipe)](./pipeline.pipeline.addpipe.md) |  | Adds one or more pipes to the pipeline. |
|  [create(options)](./pipeline.pipeline.create.md) | <code>static</code> | Constructs a new empty Pipeline instance, supporting chainable method calls. |
|  [execute(input)](./pipeline.pipeline.execute.md) |  | Executes the pipeline using the provided input. |
|  [fromJSON(json, fnMap, predefinedUses)](./pipeline.pipeline.fromjson.md) | <code>static</code> | Constructs a new Pipeline instance from a serializable configuration and a mapping of functions. |
|  [removePipe(id)](./pipeline.pipeline.removepipe.md) |  | Removes a pipe from the pipeline based on its ID. |
|  [setOnProgress(callback)](./pipeline.pipeline.setonprogress.md) |  | Sets a callback to track the pipeline's execution progress. |
|  [toJSON()](./pipeline.pipeline.tojson.md) |  | Serializes the pipeline's configuration to a JSON-friendly format. |

