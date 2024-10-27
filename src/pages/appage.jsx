// import './app.css';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { matchPath, Route, Routes, useLocation } from 'react-router-dom';
import 'swiped-events';
import { useSnapshot } from 'valtio';

import BackgroundService from '../components/background-service';
import ComposeButton from '../components/compose-button';
import { ICONS } from '../components/icon';
import KeyboardShortcutsHelp from '../components/keyboard-shortcuts-help';
import Loader from '../components/loader';
import Modals from '../components/modals';
import NotificationService from '../components/notification-service';
import SearchCommand from '../components/search-command';
import Shortcuts from '../components/shortcuts';
import NotFound from './404';
import AccountStatuses from './account-statuses';
import Bookmarks from './bookmarks';
import Favourites from './favourites';
import FollowedHashtags from './followed-hashtags';
import Following from './following';
import Hashtag from './hashtag';
import Home from './home';
import HttpRoute from './http-route';
import List from './list';
import Lists from './lists';
import Login from './login';
import Mentions from './mentions';
import Notifications from './notifications';
import Public from './public';
import Search from './search';
import StatusRoute from './status-route';
import Trending from './trending';
import Welcome from './welcome';
import {
  api,
  initAccount,
  initClient,
  initInstance,
  initPreferences,
} from '../utils/api';
import { getAccessToken } from '../utils/auth';
import focusDeck from '../utils/focus-deck';
import states, { initStates } from '../utils/states';
import store from '../utils/store';
import { getCurrentAccount } from '../utils/store-utils';
import '../utils/toast-alert';

window.__STATES__ = states;

window.__STATES_STATS__ = () => {
  const keys = [
    'statuses',
    'accounts',
    'spoilers',
    'unfurledLinks',
    'statusQuotes',
  ];
  const counts = {};
  keys.forEach((key) => {
    counts[key] = Object.keys(states[key]).length;
  });
  console.warn('STATE stats', counts);

  const { statuses } = states;
  const unmountedPosts = [];
  for (const key in statuses) {
    const $post = document.querySelector(
      `[data-state-post-id~="${key}"], [data-state-post-ids~="${key}"]`,
    );
    if (!$post) {
      unmountedPosts.push(key);
    }
  }
  console.warn('Unmounted posts', unmountedPosts.length, unmountedPosts);
};

// Preload icons
// There's probably a better way to do this
// Related: https://github.com/vitejs/vite/issues/10600
setTimeout(() => {
  for (const icon in ICONS) {
    setTimeout(() => {
      if (Array.isArray(ICONS[icon])) {
        ICONS[icon][0]?.();
      } else if (typeof ICONS[icon] === 'object') {
        ICONS[icon].module?.();
      } else {
        ICONS[icon]?.();
      }
    }, 1);
  }
}, 5000);

function Appage() {
  const snapStates = useSnapshot(states);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [uiState, setUIState] = useState('loading');

  useLayoutEffect(() => {
    const theme = store.local.get('theme');
    if (theme) {
      document.documentElement.classList.add(`is-${theme}`);
      document
        .querySelector('meta[name="color-scheme"]')
        .setAttribute('content', theme === 'auto' ? 'dark light' : theme);
    }
    const textSize = store.local.get('textSize');
    if (textSize) {
      document.documentElement.style.setProperty(
        '--text-size',
        `${textSize}px`,
      );
    }
  }, []);

  useEffect(() => {
    const instanceURL = store.local.get('instanceURL');
    const code = decodeURIComponent(
      (window.location.search.match(/code=([^&]+)/) || [, ''])[1],
    );

    if (code) {
      console.log({ code });
      // Clear the code from the URL
      window.history.replaceState({}, document.title, location.pathname || '/');

      const clientID = store.session.get('clientID');
      const clientSecret = store.session.get('clientSecret');
      const vapidKey = store.session.get('vapidKey');

      (async () => {
        setUIState('loading');
        const { access_token: accessToken } = await getAccessToken({
          instanceURL,
          client_id: clientID,
          client_secret: clientSecret,
          code,
        });

        const client = initClient({ instance: instanceURL, accessToken });
        await Promise.allSettled([
          initInstance(client, instanceURL),
          initAccount(client, instanceURL, accessToken, vapidKey),
        ]);
        initStates();
        initPreferences(client);

        setIsLoggedIn(true);
        setUIState('default');
      })();
    } else {
      window.__IGNORE_GET_ACCOUNT_ERROR__ = true;
      const account = getCurrentAccount();
      if (account) {
        store.session.set('currentAccount', account.info.id);
        const { client } = api({ account });
        const { instance } = client;
        // console.log('masto', masto);
        initStates();
        initPreferences(client);
        setUIState('loading');
        (async () => {
          try {
            await initInstance(client, instance);
          } catch (e) {
          } finally {
            setIsLoggedIn(true);
            setUIState('default');
          }
        })();
      } else {
        setUIState('default');
      }
    }
  }, []);

  let location = useLocation();
  states.currentLocation = location.pathname;

  useEffect(focusDeck, [location, isLoggedIn]);

  const prevLocation = snapStates.prevLocation;
  const backgroundLocation = useRef(prevLocation || null);
  const isModalPage = useMemo(() => {
    return (
      matchPath('/:instance/s/:id', location.pathname) ||
      matchPath('/s/:id', location.pathname)
    );
  }, [location.pathname, matchPath]);
  if (isModalPage) {
    if (!backgroundLocation.current) backgroundLocation.current = prevLocation;
  } else {
    backgroundLocation.current = null;
  }
  console.debug({
    backgroundLocation: backgroundLocation.current,
    location,
  });

  if (/\/https?:/.test(location.pathname)) {
    return <HttpRoute />;
  }

  const nonRootLocation = useMemo(() => {
    const { pathname } = location;
    return !/^\/(login|welcome)/.test(pathname);
  }, [location]);

  // Change #app dataset based on snapStates.settings.shortcutsViewMode
  useEffect(() => {
    const $app = document.getElementById('app');
    if ($app) {
      $app.dataset.shortcutsViewMode = snapStates.shortcuts?.length
        ? snapStates.settings.shortcutsViewMode
        : '';
    }
  }, [snapStates.shortcuts, snapStates.settings.shortcutsViewMode]);

  // Add/Remove cloak class to body
  useEffect(() => {
    const $body = document.body;
    $body.classList.toggle('cloak', snapStates.settings.cloakMode);
  }, [snapStates.settings.cloakMode]);

  return (
    <>
      <Routes location={nonRootLocation || location}>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Home />
            ) : uiState === 'loading' ? (
              <Loader id="loader-root" />
            ) : (
              <Welcome />
            )
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/welcome" element={<Welcome />} />
      </Routes>
      <Routes location={backgroundLocation.current || location}>
        {isLoggedIn && (
          <Route path="/notifications" element={<Notifications />} />
        )}
        {isLoggedIn && <Route path="/mentions" element={<Mentions />} />}
        {isLoggedIn && <Route path="/following" element={<Following />} />}
        {isLoggedIn && <Route path="/b" element={<Bookmarks />} />}
        {isLoggedIn && <Route path="/f" element={<Favourites />} />}
        {isLoggedIn && (
          <Route path="/l">
            <Route index element={<Lists />} />
            <Route path=":id" element={<List />} />
          </Route>
        )}
        {isLoggedIn && <Route path="/ft" element={<FollowedHashtags />} />}
        <Route path="/:instance?/t/:hashtag" element={<Hashtag />} />
        <Route path="/:instance?/a/:id" element={<AccountStatuses />} />
        <Route path="/:instance?/p">
          <Route index element={<Public />} />
          <Route path="l" element={<Public local />} />
        </Route>
        <Route path="/:instance?/trending" element={<Trending />} />
        <Route path="/:instance?/search" element={<Search />} />
        {/* <Route path="/:anything" element={<NotFound />} /> */}
      </Routes>
      {uiState === 'default' && (
        <Routes>
          <Route path="/:instance?/s/:id" element={<StatusRoute />} />
        </Routes>
      )}
      {isLoggedIn && <ComposeButton />}
      {isLoggedIn &&
        !snapStates.settings.shortcutsColumnsMode &&
        snapStates.settings.shortcutsViewMode !== 'multi-column' && (
          <Shortcuts />
        )}
      <Modals />
      {isLoggedIn && <NotificationService />}
      <BackgroundService isLoggedIn={isLoggedIn} />
      {uiState !== 'loading' && <SearchCommand onClose={focusDeck} />}
      <KeyboardShortcutsHelp />
    </>
  );
}

export { Appage };