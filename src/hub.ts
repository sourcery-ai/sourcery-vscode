export function getHubSrc() {
  return `<!DOCTYPE html>
<head>
<meta charset="UTF-8" />
<title>Sourcery Hub</title>
<style>
    body,
    html {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    }
    .container {
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    overflow: hidden;
    }
    #theFrame {
    flex-grow: 1;
    border: none;
    margin: 0;
    padding: 0;
    }
</style>
</head>
<html lang="en" style="height: 100%; width: 100%; margin: 0; padding: 0">
<body style="height: 100%; width: 100%; margin: 0; padding: 0">
    <div class="container">
    <iframe id="theFrame" src="http://127.0.0.1:61816/"></iframe>
    </div>
</body>
</html>`;
}
