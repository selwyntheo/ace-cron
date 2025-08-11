import React from 'react';
import { createRoot } from 'react-dom/client';
import CronBuilderDemo from './cron-expression-builder';
import React19Test from './React19Test';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <>
    <React19Test />
    <CronBuilderDemo />
  </>
);
