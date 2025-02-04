/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';

import ChangePasswordForm from '../components-v1/change-password-form';
import CredentialsForm from '../components-v1/credentials-form';
import ForgetPassword from '../components-v1/forget-password';

const formState = {
	credentials: 'credentials',
	waiting: 'waiting',
	twoFactor: 'two-factor',
	changePassword: 'change-password'
};

const zimbraLogin = (username, password) => {
	return fetch('/service/soap/AuthRequest', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			Body: {
				AuthRequest: {
					_jsns: 'urn:zimbraAccount',
					csrfTokenSecured: '1',
					persistAuthTokenCookie: '1',
					generateDeviceId: '1',
					account: {
						by: 'name',
						_content: username
					},
					password: {
						_content: password
					},
					prefs: [{ pref: { name: 'zimbraPrefMailPollingInterval' } }]
				}
			}
		})
	});
};

export function ZimbraForm({ destinationUrl }) {
	const { t } = useTranslation();
	const [authError, setAuthError] = useState();
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState(formState.credentials);
	const [loadingChangePassword, setLoadingChangePassword] = useState(false);
	const [loadingCredentials, setLoadingCredentials] = useState(false);
	const [email, setEmail] = useState('');

	const submitCredentials = useCallback(
		(username, password) => {
			setLoading(true);
			setLoadingCredentials(true);
			return zimbraLogin(username, password)
				.then(async (res) => {
					let payload;
					try {
						payload = await res.json();
					} catch (err) {
						payload = await res;
					}
					setLoadingCredentials(false);
					setEmail(username);
					if (payload?.Body?.Fault) {
						if (
							payload.Body.Fault?.Detail?.Error?.Code &&
							payload.Body.Fault?.Detail?.Error?.Code === 'account.CHANGE_PASSWORD'
						) {
							setProgress(formState.changePassword);
						} else {
							throw new Error(payload.Body.Fault.Reason.Text);
						}
					}
					switch (res.status) {
						case 200:
							window.location.assign(destinationUrl || window.location.origin);
							break;
						case 401:
						case 500:
							setAuthError(
								t(
									'credentials_not_valid',
									'Credentials are not valid, please check data and try again'
								)
							);
							setLoading(false);
							break;
						case 403:
							setAuthError(
								t(
									'auth_not_valid',
									'The authentication policy needs more steps: please contact your administrator for more information'
								)
							);
							setLoading(false);
							break;
						case 502:
							setAuthError(
								t('server_unreachable', 'Error 502: Service Unreachable - Retry later.')
							);
							setLoading(false);
							break;
						default:
							setLoading(false);
					}
				})
				.catch((err) => {
					setLoading(false);
					setLoadingCredentials(false);
					if (err.message.startsWith('authentication failed'))
						setAuthError(
							t(
								'credentials_not_valid',
								'Credentials are not valid, please check data and try again'
							)
						);
					else setAuthError(err.message);
				});
		},
		[destinationUrl, t]
	);

	const onClickForgetPassword = useCallback(() => {
		setProgress(formState.forgetPassword);
	}, []);

	return (
		<>
			{progress === formState.credentials && (
				<CredentialsForm
					configuration={{ destinationUrl, authMethods: ['zimbra'] }}
					disableInputs={false}
					authError={authError}
					submitCredentials={submitCredentials}
					loading={loading}
					onClickForgetPassword={onClickForgetPassword}
				/>
			)}
			{progress === formState.changePassword && (
				<ChangePasswordForm
					isLoading={loadingChangePassword}
					setIsLoading={setLoadingChangePassword}
					configuration={{
						destinationUrl: window.location.origin,
						authMethods: ['zimbra']
					}}
					username={email}
				/>
			)}
			{progress === formState.forgetPassword && (
				<ForgetPassword
					configuration={{ destinationUrl: window.location.origin, authMethods: ['zimbra'] }}
					disableInputs={false}
				/>
			)}
		</>
	);
}
