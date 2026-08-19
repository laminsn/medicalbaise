import assert from 'assert';
import {
  CLIENT_INVITE_APP_KEY,
  CLIENT_INVITE_COOKIE_MAX_AGE_SEC,
  CLIENT_INVITE_WELCOME_COPY,
  buildClientInviteShareBody,
  buildClientInviteWelcomeUrl,
  buildGoogleInviteRedirectTo,
  inviteResumePath,
  isAllowedClientInviteAppKey,
  isWellFormedInviteToken,
  medicalInviteAppKey,
  readInviteTokenFromLocation,
  resumePathAfterAuth,
  sanitizeInviteReturn,
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
assert.ok(CLIENT_INVITE_COOKIE_MAX_AGE_SEC <= 30 * 60);
assert.ok(CLIENT_INVITE_COOKIE_MAX_AGE_SEC < 7 * 24 * 60 * 60);

assert.equal(sanitizeInviteReturn('https://evil.example/invite/' + token), '/customer-dashboard');
assert.equal(sanitizeInviteReturn('/invite/' + token), `/invite/${token}`);
assert.equal(sanitizeInviteReturn('//evil.example'), '/customer-dashboard');

const google = buildGoogleInviteRedirectTo(token, 'https://www.mdbaise.com');
assert.equal(google.startsWith('https://www.mdbaise.com/auth/callback?'), true);
assert.equal(google.includes(`token=${encodeURIComponent(token)}`), true);
assert.equal(google.includes(`next=${encodeURIComponent('/invite/' + token)}`), true);
assert.equal(buildGoogleInviteRedirectTo('nope', 'https://www.mdbaise.com'), 'https://www.mdbaise.com/auth/callback');

assert.equal(resumePathAfterAuth('https://evil.example/phish', token), `/invite/${token}`);
assert.equal(resumePathAfterAuth('/invite/' + token, null), `/invite/${token}`);
assert.equal(resumePathAfterAuth('https://evil.example/', null), '/');
assert.equal(resumePathAfterAuth(null, null), '/');

assert.equal(readInviteTokenFromLocation({ pathToken: token }), token);
assert.equal(readInviteTokenFromLocation({ pathname: `/invite/${token}` }), token);
assert.equal(readInviteTokenFromLocation({ search: `token=${token}` }), token);
assert.equal(readInviteTokenFromLocation({ pathToken: '1', search: 'token=bad' }), null);

const url = 'https://www.mdbaise.com/invite/' + 'c'.repeat(64);
assert.equal(buildClientInviteShareBody(url), `${CLIENT_INVITE_WELCOME_COPY}\n${url}`);
assert.equal(buildClientInviteShareBody(url).includes('@'), false);
assert.equal(buildClientInviteShareBody(url).includes('patient'), false);

console.log('client invite helpers ok');
