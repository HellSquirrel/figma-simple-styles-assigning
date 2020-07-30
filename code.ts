// Helpers

function getSourceForPaintStyle(style, styles) {
  var source = null;
  for (const currentStyle of styles) {
    if (style.description.includes(currentStyle.name)) {
      source = currentStyle;
      break;
    }
  }
  return source;
}

function getReceiverSourcePairs(styles) {
  const stylesSorted = [...styles].sort(
    (a, b) => b.name.length - a.name.length
  );
  return styles.reduce((pairs, style) => {
    pairs.push({
      receiver: style,
      source: getSourceForPaintStyle(style, stylesSorted),
    });
    return pairs;
  }, []);
}

function getPaintStyleByName(styleName, styles) {
  return styles.filter((style) => style.name === styleName)[0];
}

// Start point

figma.showUI(__html__, { width: 600, height: 360 });

const styles = figma.getLocalPaintStyles();
const receiverSourcePairs = getReceiverSourcePairs(styles);
receiverSourcePairs.forEach((pair) => {
  if (pair.source) {
    pair.receiver.paints = pair.source.paints;
  }
});
const receiverSourceData = receiverSourcePairs.map((pair, index) => ({
  receiver: {
    name: pair.receiver.name,
    idFigmaPaintStyle: pair.receiver.id,
  },
  source: {
    name: pair.source ? pair.source.name : "",
    idDOMElement: `input-style-source-${index}`,
  },
}));
figma.ui.postMessage({
  type: "render",
  receiverSourceData: receiverSourceData,
});

// Events handler

figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case "update-name-in-description": {
      const paintStyle = figma.getStyleById(msg.idFigmaNode);
      if (!paintStyle) return;
      paintStyle.description = msg.newName;
      figma.notify(`New source style: ${msg.newName}`);
      break;
    }

    case "assign-new-source": {
      const styleReceiver = figma.getStyleById(msg.idFigmaNode) as PaintStyle;
      if (!styleReceiver) return;
      const styleSource = getPaintStyleByName(msg.sourceName, styles);
      if (!styleSource) return;
      styleReceiver.paints = styleSource.paints;
    }

    default: {
      break;
    }
  }
};
