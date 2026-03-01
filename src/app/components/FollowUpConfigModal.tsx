// src/app/components/FollowUpConfigModal.tsx (Versão Simplificada para Teste)
import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';

interface FollowUpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUpClientId: string | null;
}

export default function FollowUpConfigModal({
  isOpen,
  onClose,
  followUpClientId,
}: FollowUpConfigModalProps) {
  console.log(
    '[FollowUpConfigModal SIMPLIFICADO] Rendering. isOpen:',
    isOpen,
    'followUpClientId:',
    followUpClientId
  );

  // Retorna null se não estiver aberto (comportamento padrão do Modal NextUI, mas explícito aqui)
  // Removido para garantir que o Modal seja sempre renderizado quando isOpen=true
  // if (!isOpen) {
  //   return null;
  // }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" backdrop="blur">
      {' '}
      {/* Adicionado backdrop */}
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Teste Follow-up Modal ({followUpClientId})
            </ModalHeader>
            <ModalBody>
              <p>Se você está vendo isso, o modal básico está funcionando!</p>
              <p>isOpen: {isOpen ? 'true' : 'false'}</p>
              <p>followUpClientId: {followUpClientId ?? 'undefined'}</p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onCloseModal}>
                Fechar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
