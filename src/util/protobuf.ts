import * as ddproto from 'digi-dungeon-protobuf';
import * as google from 'google-protobuf';

export class ProtoBufCringe {
  constructor() {}

  static DecodeRequest<T extends google.Message>(
    body: Uint8Array | Object,
    deserialize: (binary: Uint8Array) => T
  ): T {
    if (ArrayBuffer.isView(body)) {
      // Fuck how does this shit work what the hell
      let newbody = deserialize(body) as T;
      return newbody;
    } else {
      let stringy = JSON.stringify(body);
      let buffery = Uint8Array.from(Buffer.from(stringy));
      console.log(buffery);

      let newbody = deserialize(buffery) as T;
      console.log(newbody);

      return newbody;
    }
  }
}
