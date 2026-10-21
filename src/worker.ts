interface WorkerEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  fetch(request: Request, env: WorkerEnv): Response | Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === 'severance.masonhu.cc') {
      url.protocol = 'https:';
      url.hostname = 'severance.masonhu.org';
      url.port = '';
      return Response.redirect(url.toString(), 308);
    }

    return env.ASSETS.fetch(request);
  },
};
