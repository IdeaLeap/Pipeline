<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@idealeap/pipeline](./pipeline.md) &gt; [batchDecorator](./pipeline.batchdecorator.md)

## batchDecorator() function

**Signature:**

```typescript
export declare function batchDecorator<T, R>(fn: ((input: T) => Promise<R> | R) | ((input: T) => Promise<R> | R)[], options?: BatchOptions<T, R>): (input: T | T[]) => Promise<Awaited<R> | Awaited<R>[]>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  fn | ((input: T) =&gt; Promise&lt;R&gt; \| R) \| ((input: T) =&gt; Promise&lt;R&gt; \| R)\[\] |  |
|  options | [BatchOptions](./pipeline.batchoptions.md)<!-- -->&lt;T, R&gt; | _(Optional)_ |

**Returns:**

(input: T \| T\[\]) =&gt; Promise&lt;[Awaited](./pipeline.awaited_2.md)<!-- -->&lt;R&gt; \| [Awaited](./pipeline.awaited_2.md)<!-- -->&lt;R&gt;\[\]&gt;

