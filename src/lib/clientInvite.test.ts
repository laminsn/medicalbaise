import assert from 'assert';
import {
  CLIENT_INVITE_APP_KEY,
  CLIENT_INVITE_WELCOME_COPY,
  buildClientInviteShareBody,
  buildClientInviteWelcomeUrl,
  inviteResumePath,
  isAllowedClientInviteAppKey,
  isWellFormedInviteToken,
  medicalInviteAppKey,
} from './clientInvite.ts';

assert.equal(medicalInviteAppKey(), 'medical');
assert.equal(CLIENT_INVITE_APP_KEY, 'medical');
assert.equal(isAllowedClientInviteAppKey('medical'), true);
assert.equal(isAllowedClientInviteAppKey('casa'), true);
assert.equal(isAllowedClientInviteAppKey('legal'), true);
assert.equal(isAllowedClientInviteAppKey('tech'), true);
assert.equal(isAllowedClientInviteAppKey('influencer'), true);
assert.equal(isAllowedClientInviteAppKey(''), false);
assert.equal(isAllowedClientInviteAppKey(null), false);
assert.equal(isAllowedClientInviteAppKey('architect'), false);
assert.equal(isAllowedClientInviteAppKey('accountant'), false);

const hex32 = 'a'.repeat(64);
assert.equal(isWellFormedInviteToken(hex32), true);
assert.equal(isWellFormedInviteToken('1'), false);
assert.equal(isWellFormedInviteToken('00000001'), false);
assert.equal(isWellFormedInviteToken('not a token'), false);
assert.equal(isWellFormedInviteToken(''), false);

const token = 'b'.repeat(64);
assert.equal(
  buildClientInviteWelcomeUrl(token, 'https://www.mdbaise.com'),
  `https://www.mdbaise.com/invite/${token}`,
);
assert.throws(() => buildClientInviteWelcomeUrl('1', 'https://www.mdbaise.com'));
assert.equal(inviteResumePath(token), `/invite/${token}`);
assert.equal(inviteResumePath('https://evil.example/phish'), '/customer-dashboard');
assert.equal(inviteResumePath('//evil.example'), '/customer-dashboard');

const url = 'https://www.mdbaise.com/invite/' + 'c'.repeat(64);
assert.equal(buildClientInviteShareBody(url), `${CLIENT_INVITE_WELCOME_COPY}\n${url}`);
assert.equal(buildClientInviteShareBody(url).includes('@'), false);
assert.equal(buildClientInviteShareBody(url).includes('patient'), false);

console.log('client invite helpers ok');
