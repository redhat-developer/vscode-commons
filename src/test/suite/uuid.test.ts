import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import uuid, { v4, v5 } from 'uuid';
import { UUID } from '../../utils/uuid';

suite('UUID Test Suite', () => {

  test('Generate reapeatable UUIDs', () => {
    assert.strictEqual('bfd24156-a94f-5d2e-9a39-85afb0b5a9f9', UUID.generateUUID('my-kickass-id'));
  });

  test('Generate anonymousId file', () => {
    const workDir = path.join(os.tmpdir(), '.redhat');
    if (fs.existsSync(workDir)) {
      fs.rmdirSync(workDir, { recursive: true });
    }
    fs.mkdirpSync(workDir);
    UUID.getRedHatUUID(workDir);

    const anonymousIdFile = path.join(workDir, 'anonymousId');
    assert.ok(fs.existsSync(anonymousIdFile));
    const contents = fs.readFileSync(anonymousIdFile, { encoding: 'utf8' });
    console.log(`Read Red Hat UUID as ${contents}`);
  });

});