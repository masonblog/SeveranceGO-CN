interface WorkerEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  fetch(request: Request, env: WorkerEnv): Response | Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
