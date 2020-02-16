/* eslint-env browser */

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo } from 'y-prosemirror'

import { keymap } from 'prosemirror-keymap'

import {
  Editor,
  EditorContext,
  ReactEditorView,
  WithEditorActions
} from '@atlaskit/editor-core'
import Button, { ButtonGroup } from '@atlaskit/button'
import styled from 'styled-components'
window.addEventListener('load', () => {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider(`${location.protocol === 'http:' ? 'ws:' : 'wss:'}${location.host}`, 'prosemirror', ydoc)
  const type = ydoc.get('prosemirror-atlaskit', Y.XmlFragment)

  const connectBtn = document.getElementById('y-connect-btn')
  connectBtn.addEventListener('click', () => {
    if (provider.shouldConnect) {
      provider.disconnect()
      connectBtn.textContent = 'Connect'
    } else {
      provider.connect()
      connectBtn.textContent = 'Disconnect'
    }
  })

  const SaveAndCancelButtons = props => (
    <ButtonGroup>
      <Button
        appearance="primary"
        onClick={() =>
          props.editorActions
            .getValue()
            // eslint-disable-next-line no-console
            .then(value => console.log(value))
        }
      >
        Publish
      </Button>
      <Button
        appearance="subtle"
        // eslint-disable-next-line:jsx-no-lambda
        onClick={() => props.editorActions.clear()}
      >
        Close
      </Button>
    </ButtonGroup>
  )
  const TitleInput = styled.input`
  border: none;
  outline: none;
  font-size: 2.07142857em;
  margin: 0 0 21px;
  padding: 0;

  &::placeholder {
    color: red;
  }
`
  TitleInput.displayName = 'TitleInput'



  /**
   * The Atlasian Editor does not provide a method to add custom ProseMirror plugins.
   * This hack intercepts the generation of Atlassian edits so we can extend it.
   *
   * Ideally you would fork ProseMirror and add the Yjs plugin properly.
   */
  const originalGetPlugins = ReactEditorView.prototype.getPlugins
  ReactEditorView.prototype.getPlugins = function () {
    return originalGetPlugins.apply(this, arguments).concat([{
      name: 'yjs-plugin',
      pmPlugins: function () {
        return [
          {
            name: 'y-shared-content',
            plugin: function (_a) {
              return ySyncPlugin(type)
            }
            // }, {
            //   name: 'y-shared-cursors',
            //   plugin: function (_a) {
            //     return yCursorPlugin(provider.awareness)
            //   }
          }, {
            name: 'y-undo-plugin',
            plugin: yUndoPlugin
          }, {
            name: 'y-undo-keymaps',
            plugin: () => keymap({
              'Mod-z': undo,
              'Mod-y': redo,
              'Mod-Shift-z': redo
            })
          }
        ]
      }
    }])
  }
  const handleTitleOnFocus = () => this.setState({ disabled: true })
  const handleTitleOnBlur = () => this.setState({ disabled: false })
  const handleTitleRef = ref => {
    if (ref) {
      ref.focus()
    }
  }
  class ExampleEditorFullPage extends React.Component {
    render() {
      return (
        <div>salam be hame2
        <Editor
            defaultValue={this.props.defaultValue}
            appearance='full-page'
            allowCodeBlocks={{ enableKeybindingsForIDE: true }}
            allowLists
            allowBreakout
            allowTextColor
            allowTextAlignment
            allowIndentation
            allowTables={{
              allowColumnResizing: true,
              allowMergeCells: true,
              allowNumberColumn: true,
              allowBackgroundColor: true,
              allowHeaderRow: true,
              allowHeaderColumn: true,
              permittedLayouts: 'all',
              stickToolbarToBottom: true
            }}
            allowJiraIssue
            allowUnsupportedContent
            allowPanel
            allowStatus
            allowExtension={{
              allowBreakout: true
            }}
            allowRule

            allowLayouts
            allowDynamicTextSizing
            placeholder='Write something...'
            shouldFocus
            disabled={false}
            contentComponents={
              <TitleInput
                innerRef={handleTitleRef}
                // tslint:disable-next-line:jsx-no-lambda
                onBlur={handleTitleOnBlur}
                onFocus={handleTitleOnFocus}
                placeholder="Give this page a title..."
              />
            }

            primaryToolbarComponents={
              <WithEditorActions
                // tslint:disable-next-line:jsx-no-lambda
                render={actions => (
                  <SaveAndCancelButtons editorActions={actions} />
                )}
              />
            }
          />
        </div>
      )
    }
  }

  ReactDOM.render(
    <EditorContext>
      <ExampleEditorFullPage />
    </EditorContext>,
    document.getElementById('editor')
  )

  window.example = { provider, ydoc, type }
})
